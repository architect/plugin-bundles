const { join } = require('path')
const { build: esbuild } = require('esbuild')

/**
 * @typedef BundlesConfig
 * @property {string} [outDir] the bundles destination
 * @property {Array<string>} paths list of source paths
 * @property {object} pathToName source path to out name (w/o extension)
 * @property {object} nameToPath source path to out name (w/o extension)
 */

/** @type {BundlesConfig} */
const config = {
  paths: [],
  pathToName: {},
  nameToPath: {},
}

async function createConfig (arc, inventory) {
  /** @type {[[string, string]]} */
  const entries = arc.bundles
  const cwd = inventory._project.cwd

  if (!entries) { return }

  config.outDir = join(
    cwd,
    inventory.static?.folder || 'public',
    'bundles',
  )

  for (const entry of entries) {
    if (Array.isArray(entry) && entry.length === 2) {
      const [ name, path ] = entry

      if (typeof name !== 'string') {
        console.warn(`  @bundles: invalid name: "${name}". Skipping.`)
      }
      else if (typeof path !== 'string') {
        console.warn(`  @bundles: invalid input path for "${name}": "${path}". Skipping.`)
      }
      else {
        const inputPath = join(cwd, path)
        config.paths.push(inputPath)
        config.pathToName[inputPath] = name
        config.nameToPath[name] = inputPath
      }
    }
    else {
      console.warn(`  @bundles: invalid entry: ${JSON.stringify(entry)}`)
    }
  }
}

async function build (entryPoints) {
  await esbuild({
    entryPoints,
    outdir: config.outDir,
    bundle: true,
    minify: true,
    sourcemap: true,
    format: 'esm',
    target: 'es2022',
    platform: 'browser',
    outExtension: { '.js': '.mjs' }
    // external: [ 'fs', 'path' ],
  })

  const entryNames = Object.keys(entryPoints)
  const plural = entryNames.length > 1 ? 's' : ''

  console.log(`  @bundles: built ${entryNames.length} file${plural}.`)
}

async function buildAll () {
  if (!config.outDir) { return }

  await build(config.nameToPath)
}

module.exports = {
  sandbox: {
    async start ({ arc, inventory }) {
      await createConfig(arc, inventory.inv)
      await buildAll()
      console.log(`  @bundles: watching ${config.paths.length} files...`)
    },
    async watcher ({ filename: path, event }) {
      if (config.outDir
          && event === 'update'
          && config.paths.includes(path)
      ){
        await build({ [config.pathToName[path]]: path })
      }
    }
  },
  deploy: {
    async start ({ arc, cloudformation, inventory }) {
      await createConfig(arc, inventory.inv)
      await buildAll()
      return cloudformation // always return cfn
    }
  }
}
