const fs = require('fs')
const path = require('node:path')

function doStuff (){
  fs.statSync(path.join('./', 'somewhere'))
}

doStuff()
