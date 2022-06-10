const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { build } = require('esbuild')
const GET_BUNDLES = 'get-_bundles'

const set = {
  http() {
    return {
      method: 'get',
      path: '/_bundles/*',
      src: path.join(__dirname, '..', 'http', GET_BUNDLES)
    }
  }
}

const sandbox = {
  async start ({ arc, inventory }) {
    await verify(arc)
    await bundle(arc, inventory.inv)
  }
}

const deploy = {
  async start ({ arc, cloudformation, inventory }) {
    await verify(arc)
    await bundle(arc, inventory.inv)
    return cloudformation // no need to modify cfn because set.http above did that
  }
}

/**
 * verify the @bundles is valid
 */
async function verify (arc) {
  if (Array.isArray(arc.bundles) === false)
    throw Error('missing or invalid @bundles pragma')
  for (let tuple of arc.bundles) {
    if (Array.isArray(tuple)) {
      // check the key is a valid identifier string and the value is a string that resolves to a file
      let key = tuple[0]
      if (typeof key != 'string')
        throw Error('invalid @bundles key ' + key)
      let val = tuple[1]
      if (typeof val != 'string')
        throw Error('invalid @bundles value ' + val)
    }
    else {
      throw Error('invalid @bundles')
    }
  }
}

/**
 * run esbuild to generate the @bundles code
 */
async function bundle (arc, inventory) {
  const bundlesSrc = inventory.http.find(i => i.name === 'get /_bundles/*').src
  const pathToBundles = path.join(
    bundlesSrc,
    'node_modules',
    '@architect',
    'bundles'
  )
  fs.mkdirSync(pathToBundles, { recursive: true })

  for (let [ name, pathToFile ] of arc.bundles) {
    let entry = path.join(inventory._project.cwd, pathToFile)
    await build({
      entryPoints: [ entry ],
      bundle: true,
      format: 'esm',
      outfile: path.join(pathToBundles, `${name}.mjs`),
    })
  }

  // generate map
  let map = 'export default {\n'
  for (let [ name ] of arc.bundles) {
    let pathToBrowserFile = path.join(pathToBundles, `${name}.mjs`)
    let raw = fs.readFileSync(pathToBrowserFile).toString()
    let hash = crypto.createHash('md5').update(raw).digest('hex').substring(0, 7)
    map += `  "/_bundles/${name}.mjs": "/_bundles/${name}-${hash}.mjs",\n`
  }
  map += '}'

  for (let name of inventory.lambdaSrcDirs) {
    const lambda = inventory.lambdasBySrcDir[name]
    if (lambda.method && lambda.method.toLowerCase() === 'get') {
      const pathToLambdaBundles = path.join(
        lambda.src,
        'node_modules',
        '@architect',
        'bundles'
      )
      fs.mkdirSync(pathToLambdaBundles, { recursive: true })
      const pathToBrowserIndex = path.join(pathToLambdaBundles, `map.mjs`)
      fs.writeFileSync(pathToBrowserIndex, map)
    }
  }
}

module.exports = { set, sandbox, deploy }
