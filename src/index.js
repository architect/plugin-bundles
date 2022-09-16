const { existsSync } = require('fs')
const { join } = require('path')
const { build: esbuild } = require('esbuild')

/**
 * @typedef BundlesConfig
 * @property {string} [outDir] the bundles destination
 * @property {Array<string>} paths list of source paths
 * @property {object} pathToName source path to output name (w/o extension)
 * @property {object} nameToPath output name to source path (w/o extension)
 * @property {object} esbuildConfig
 */

/** @type {BundlesConfig} */
const config = {
  paths: [],
  pathToName: {},
  nameToPath: {},
  esbuildConfig: {},
}

async function createConfig (arc, inventory) {
  /** @type {[[string, string]]} */
  const entries = arc.bundles
  const cwd = inventory._project.cwd

  if (!entries) { return }

  const configPath = join(cwd, 'esbuild.config.js')
  if (existsSync(configPath)) {
    // eslint-disable-next-line global-require
    config.esbuildConfig = require(configPath)
  }

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
    bundle: true,
    format: 'esm',
    target: 'es2022',
    platform: 'browser',
    outExtension: { '.js': '.mjs' },
    external: [ 'fs', 'path' ],
    ...config.esbuildConfig, // user config
    entryPoints, // do not allow entryPoints and outdir override
    outdir: config.outDir,
  })
}

async function buildAll () {
  if (!config.outDir) { return }

  await build(config.nameToPath)

  const plural = config.paths.length > 1 ? 's' : ''
  console.log(`  @bundles: built ${config.paths.length} file${plural}.`)
}

module.exports = {
  sandbox: {
    async start ({ arc, inventory }) {
      await createConfig(arc, inventory.inv)

      if (config.paths.length > 0){
        await buildAll()
        console.log(`  @bundles: watching ${config.paths.length} files...`)
      }
    },
    async watcher ({ filename: path, event }) {
      if (config.outDir
          && event === 'update'
          && config.paths.includes(path)
      ){
        await build({ [config.pathToName[path]]: path })
        console.log(`  @bundles: rebuilt "${path.split('/').pop()}"`)
      }
    }
  },
  deploy: {
    async start ({ arc, cloudformation, inventory }) {
      await createConfig(arc, inventory.inv)

      if (config.paths.length > 0){
        await buildAll()
      }

      return cloudformation // always return cfn
    }
  }
}
