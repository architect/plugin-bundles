const { join } = require('path')
const { existsSync, rmSync } = require('fs')
const test = require('tape')
const { get } = require('tiny-json-http')
const sandbox = require('@architect/sandbox')
const path = require('path')
const workingDirectory = join(process.cwd(), 'test', 'mock')
const port = 6661
const url = (path, port) => `http://localhost:${port}/${path}`
const leftovers = path.join('get-_bundles')

async function cleanup () {
  if (existsSync(leftovers)) {
    rmSync(leftovers, { recursive: true, force: true })
  }
}

test('Start sandbox', async t => {
  t.plan(1)
  await cleanup()
  await sandbox.start({
    cwd: workingDirectory,
    port
  })
  t.pass('Sandbox started')
})

test('Get bundles', async t => {
  t.plan(1)
  const res = await get({
    url: url('yolo', port),
    port
  })
  t.ok(res, `Map was generated ${JSON.stringify(res.body.json, null, 2)}`)
})

test('Shut down Sandbox', async t => {
  t.plan(1)
  await cleanup()
  await sandbox.end()
  t.pass('Shut down Sandbox')
})
