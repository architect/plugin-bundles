const fs = require('fs')
const path = require('node:path') // if this string isn't included in esbuild.config[external], esbuild throws

function doStuff (){
  fs.statSync(path.join('./', 'somewhere'))
}

doStuff()
