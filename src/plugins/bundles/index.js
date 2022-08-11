const path = require('path')
const { build } = require('esbuild')

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
  if (!arc.bundles) return
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
  if (!arc.bundles) return
  const pathToStatic = path.join(inventory._project.cwd, inventory?.static?.folder || 'public')
  const pathToStaticBundles = path.join(pathToStatic, 'bundles')
  for (let [ name, pathToFile ] of arc.bundles) {
    let entry = path.join(inventory._project.cwd, pathToFile)
    await build({
      entryPoints: [ entry ],
      bundle: true,
      format: 'esm',
      target: [ 'es2022' ],
      platform: 'browser',
      external: [ 'fs', 'path' ],
      outfile: path.join(pathToStaticBundles, `${name}.mjs`),
    })
  }
}

module.exports = { sandbox, deploy }
