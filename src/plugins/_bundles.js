const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { build } = require('esbuild')

const set = {
  http () {
    return {
      method: 'get',
      path: '/_bundles/*',
      src: path.join(__dirname, '..', 'http', 'get-_bundles')
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
  for (let name of inventory.lambdaSrcDirs) {
    let lambda = inventory.lambdasBySrcDir[name]
    if (lambda.method && lambda.method.toLowerCase() === 'get') {
      // create @architect/views/bundles
      let pathToImportMap = path.join(
        lambda.src,
        'node_modules',
        '@architect',
        'views',
        'bundles'
      )
      fs.mkdirSync(pathToImportMap, { recursive: true })
      for (let [ name, pathToFile ] of arc.bundles) {
        let entry = path.join(inventory._project.cwd, pathToFile)
        // create @architect/views/bundles for browser usage
        await build({
          entryPoints: [ entry ],
          bundle: true,
          format: 'esm',
          outfile: path.join(pathToImportMap, `${name}.mjs`),
        })
      }
      // create @architect/views/bundles/index.mjs for browser manifest
      let mjs = 'export default {\n'
      for (let [ name ] of arc.bundles) {
        let pathToBrowserFile = path.join(pathToImportMap, `${name}.mjs`)
        let raw = fs.readFileSync(pathToBrowserFile).toString()
        let hash = crypto.createHash('md5').update(raw).digest('hex').substring(0, 7)
        mjs += `  "${name}": "/_bundles/${name}-${hash}.mjs",\n`
      }
      mjs += '}'
      let pathToBrowserIndex = path.join(pathToImportMap, `index.mjs`)
      fs.writeFileSync(pathToBrowserIndex, mjs)
    }
  }
}

module.exports = { set, sandbox, deploy }
