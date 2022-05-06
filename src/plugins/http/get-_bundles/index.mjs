import map from '@architect/bundles/map.mjs'
import fs from 'fs'
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export async function handler (req) {

  const reverse = {}
  for (let key in map)
    reverse[map[key]] = key

  if (Object.keys(reverse).includes(req.rawPath) === false) {
    return {
      statusCode: 404,
      body: {errors:['not_found: ' + req.rawPath]}
    }
  }

  const base = path.join(__dirname, 'node_modules', '@architect', 'bundles')
  const pathToFile = path.join(base, reverse[req.rawPath].split('/').pop())
  return {
    statusCode: 200,
    headers: {
      'content-type': 'text/javascript; charset=utf8'
    },
    body: fs.readFileSync(pathToFile).toString()
  }
}