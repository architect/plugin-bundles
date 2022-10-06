/** @type {import('esbuild').BuildOptions} */
module.exports = {
  sourcemap: true,
  minify: true,
  external: [ 'fs', 'node:path' ],
}
