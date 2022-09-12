const { join } = require('path')
const { rmSync } = require('fs')
const test = require('tape')
const { get } = require('tiny-json-http')
const sandbox = require('@architect/sandbox')

const workingDirectory = join(process.cwd(), 'test', 'mock')
const port = 6661
const getUrl = (path, port) => `http://localhost:${port}${path}`

test('Start sandbox', async t => {
  t.plan(1)

  await sandbox.start({
    quiet: true,
    cwd: workingDirectory,
    port
  })

  t.pass('Sandbox started')
})

test('Get finerprinted URL for assets', async t => {
  const assetNames = [ 'yolo', 'some-ts' ]

  t.plan(assetNames.length)

  for (const file of assetNames) {
    const url = getUrl(`/_static/bundles/${file}.mjs`, port)
    const fileReq = await get({ url, port })

    t.ok(fileReq.body, `Valid bundle URL: ${url}` )
  }
})

test('cleanup', async t => {
  t.plan(2)

  await rmSync(join(workingDirectory, 'public'), { recursive: true, force: true })
  t.pass('Tests files cleaned up')

  await sandbox.end()
  t.pass('Shut down Sandbox')
})
