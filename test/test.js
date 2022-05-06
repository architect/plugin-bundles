const { join } = require('path')
const test = require('tape')
const { get } = require('tiny-json-http')
const sandbox = require('@architect/sandbox')
const workingDirectory = join(process.cwd(), 'test', 'mock')
const port = 6661
const url = (path, port) => `http://localhost:${port}${path}`

test('Start sandbox', async t => {
  t.plan(1)
  await sandbox.start({
    cwd: workingDirectory,
    port
  })
  t.pass('Sandbox started')
})

test('Verify map', async t => {
  t.plan(1)
  const res = await get({
    url: url('/yolo', port),
    port
  })
  t.ok(res, `Map was generated ${JSON.stringify(res.body.json, null, 2)}`)
})

test('Get file via fingerprinted url', async t => {
  t.plan(1)
  const mapRes = await get({
    url: url('/yolo', port),
    port
  })
  const _map = mapRes.body.json
  const fingerprintedPath = _map[Object.keys(_map)[0]]
  const res = await get({
    url: url(fingerprintedPath, port),
    port
  })
  t.ok(res, `Got file via fingerprinted url ${fingerprintedPath}` )
})

test('Shut down Sandbox', async t => {
  t.plan(1)
  await sandbox.end()
  t.pass('Shut down Sandbox')
})
