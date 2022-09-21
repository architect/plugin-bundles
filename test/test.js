const { join } = require('path')
const { rmSync, writeFileSync } = require('fs')
const test = require('tape')
const { get } = require('tiny-json-http')
const sandbox = require('@architect/sandbox')

const mocksDir = join(process.cwd(), 'test', 'mocks')
const projectDirs = {
  vanilla: join(mocksDir, 'vanilla'),
  esbuildConfig: join(mocksDir, 'esbuild-config'),
  esbuildError: join(mocksDir, 'esbuild-error'),
}
const port = 6661
const makeUrl = (path) => `http://localhost:${port}${path}`

test('Vanilla bundles project', async (st) => {
  st.test('Start Sandbox', async (t) => {
    t.plan(1)

    await sandbox.start({
      quiet: true,
      cwd: projectDirs.vanilla,
      port,
    })

    t.pass('Sandbox started')
  })

  st.test('Get assets', async (t) => {
    const assetNames = [ 'yolo.mjs', 'some-ts.mjs', 'styles.css' ]

    t.plan(assetNames.length)

    for (const file of assetNames) {
      const url = makeUrl(`/_static/bundles/${file}`)
      const { body } = await get({ url })

      t.ok(body, `Valid bundle URL: ${url}`)
    }
  })

  st.test('Stop Sandbox', async (t) => {
    t.plan(1)
    t.pass(await sandbox.end())
  })
})

test('Configured-esbuild bundles project', async (st) => {
  st.test('Start Sandbox', async (t) => {
    t.plan(1)

    await sandbox.start({
      quiet: true,
      cwd: projectDirs.esbuildConfig,
      port,
    })

    t.pass('Sandbox started')
  })

  st.test('Get asset', async (t) => {
    t.plan(2)

    const url = makeUrl('/_static/bundles/node-internals.mjs')
    const { body } = await get({ url })

    t.ok(body, `Valid bundle URL: ${url}`)
    t.ok(body.indexOf('//# sourceMappingURL=') > 0, 'esbuild.config applied')
  })

  st.test('Stop Sandbox', async (t) => {
    t.plan(1)
    t.pass(await sandbox.end())
  })
})

test('Bundles project with esbuild error', async (st) => {
  st.test('Start Sandbox', async (t) => {
    t.plan(1)

    try {
      await sandbox.start({
        quiet: false, // so we can see the esbuild error
        cwd: projectDirs.esbuildError,
        port,
      })

      t.pass('Sandbox started despite esbuild error')
    }
    catch (_error) {
      t.fail('Sandbox could not start!')
    }
  })

  const url = makeUrl('/_static/bundles/my-styles.css')
  const stylePath = join(projectDirs.esbuildError, 'lib', 'styles.css')

  st.test('Get bad asset', async (t) => {
    t.plan(1)

    try {
      await get({ url })
      t.fail('Expecting request to fail!')
    }
    catch (_error) {
      t.pass(`Expected bad response: ${url}`)
    }
  })

  st.test('Add missing file and request it', async t => {
    /**
     * In theory, this would resolve the error by:
     * 1. adding the file (this works)
     * 2. bundles watcher builds it (never fires)
     * 3. get() would fetch the url successfully
     *
     * This would test the whole dev loop working
     */

    t.plan(1)

    writeFileSync(stylePath, 'h1{font-weight:bold;}')

    await new Promise(r => setTimeout(r, 5000)) // let Sandbox watcher run

    const { body } = await get({ url })
    t.ok(body, `Valid bundle URL: ${url}`)
  })

  st.test('Stop Sandbox', async (t) => {
    t.plan(2)
    t.pass(await sandbox.end())
    rmSync(stylePath)
    t.pass('removed new style.css asset')
  })
})

test('Projects cleanup', (t) => {
  t.plan(3)

  for (const project in projectDirs) {
    const dir = projectDirs[project]
    rmSync(join(dir, 'public'), { recursive: true, force: true })
    t.pass(`Cleaned up files for ${project}`)
  }
})
