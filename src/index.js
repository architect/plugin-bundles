const { join } = require('path')
const { build: esbuild } = require('esbuild')

/**
 * @typedef BundlesConfig
 * @property {string} [outDir] the bundles destination
 * @property {Array<[string, string]>} entries modified config with full source paths
 * @property {Array<string>} paths list of source paths
 * @property {object} lookup source path to out name (w/o extenstion)
 */

/** @type {BundlesConfig} */
const config = {
  entries: [],
  paths: [],
  lookup: {},
}

async function readConfig (arc, inventory) {
  /** @type {[[string, string]]} */
  const entries = arc.bundles

  if (!entries) { return }

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
        const fullPath = join(inventory._project.cwd, path)
        config.entries.push([ name, fullPath ])
        config.paths.push(fullPath)
        config.lookup[fullPath] = name
      }
    }
    else {
      console.warn(`  @bundles: invalid entry: ${JSON.stringify(entry)}`)
    }
  }

  const pathToStatic = join(inventory._project.cwd, inventory.static?.folder || 'public')
  config.outDir = join(pathToStatic, 'bundles')
}

async function build (entryFile, outfile) {
  await esbuild({
    entryPoints: [ entryFile ],
    outfile,
    bundle: true,
    minify: true,
    sourcemap: true,
    format: 'esm',
    target: 'es2022',
    platform: 'browser',
    // external: [ 'fs', 'path' ],
  })

  console.log(`  @bundles: built "${outfile.split('/bundles/')[1]}"`)
}

async function buildAll () {
  if (!config.outDir) { return }

  for (const [ name, path ] of config.entries) {
    await build(path, join(config.outDir, `${name}.mjs`))
  }
}

module.exports = {
  sandbox: {
    async start ({ arc, inventory }) {
      await readConfig(arc, inventory.inv)
      await buildAll()
      console.log(`  @bundles: watching ${config.paths.length} files...`)
    },
    async watcher ({ filename: path, event }) {
      if (config.outDir
          && config.entries.length > 0
          && event === 'update'
          && config.paths.includes(path)
      ){
        await build(path, join(config.outDir, `${config.lookup[path]}.mjs`))
      }
    }
  },
  deploy: {
    async start ({ arc, cloudformation, inventory }) {
      await readConfig(arc, inventory.inv)
      await buildAll()
      return cloudformation // always return cfn
    }
  }
}
