const { existsSync } = require('fs')
const { join } = require('path')
const { build: esbuild } = require('esbuild')

const CONFIG_FILENAME = 'esbuild.config.js'

/**
 * @typedef BundlesConfig
 * @property {string} [outDir] the bundles destination
 * @property {Array<string>} paths list of source paths
 * @property {object} pathToName source path to output name (w/o extension)
 * @property {object} nameToPath output name to source path (w/o extension)
 * @property {object | null} esbuildConfig user provided esbuild config
 * @property {object | null} entryPoints bundle entry points, keyed by name
 */

/**
 * @return {BundlesConfig | null}
 */
function createConfig (arc, inventory) {
  /** @type {[[string, string]]} */
  const entries = arc.bundles
  const cwd = inventory._project.cwd

  if (!entries) { return null }

  /** @type {BundlesConfig} */
  const config = {
    paths: [],
    pathToName: {},
    nameToPath: {},
    esbuildConfig: null,
    entryPoints: null,
  }

  const configPath = join(cwd, CONFIG_FILENAME)
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

  return config
}

async function build (config) {
  if (!config.entryPoints) { return }

  await esbuild({
    bundle: true,
    format: 'esm',
    target: 'es2022',
    platform: 'browser',
    outExtension: { '.js': '.mjs' },
    external: [ 'fs', 'path' ],
    ...(config.esbuildConfig || {}), // user config
    entryPoints: config.entryPoints, // can't override entryPoints or outdir
    outdir: config.outDir,
  })
}

async function buildAll (config) {
  if (config.esbuildConfig) {
    console.log(`  @bundles: Imported settings from ${CONFIG_FILENAME}.`)
  }

  config.entryPoints = config.nameToPath
  await build(config)

  const plural = config.paths.length > 1 ? 's' : ''
  console.log(`  @bundles: Bundled ${config.paths.length} file${plural}.`)
}

module.exports = {
  sandbox: {
    async start ({ arc, inventory: { inv } }) {
      const config = createConfig(arc, inv)

      if (config && config.paths.length > 0){
        await buildAll(config)
      }
    },

    async watcher ({ arc, event, filename: path, inventory: { inv } }) {
      const config = createConfig(arc, inv)

      if (
        config
        && event === 'update'
        && config.paths.includes(path)
      ) {
        config.entryPoints = { [config.pathToName[path]]: path }
        await build(config)
        console.log(`  @bundles: Re-bundled "${path.split('/').pop()}"`)
      }
    }
  },

  deploy: {
    async start ({ arc, cloudformation, inventory: { inv } }) {
      const config = createConfig(arc, inv)

      if (config && config.paths.length > 0) {
        await buildAll(config)
      }

      return cloudformation // always return cfn
    }
  }
}
