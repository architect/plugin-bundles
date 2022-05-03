const { join } = require('path')
// const { existsSync, readFileSync, rmSync } = require('fs')
const test = require('tape')
// const { get } = require('tiny-json-http')
const sandbox = require('@architect/sandbox')

const port = 666
const mock = join(process.cwd(), 'test', 'mock')

test('Start sandbox', async t => {
  t.plan(1)
  await sandbox.start({
    cwd: mock,
    port
  })
  t.pass('Sandbox started')
})

test('Shut down Sandbox', async t => {
  t.plan(1)
  await sandbox.end()
  t.pass('Shut down Sandbox')
})
