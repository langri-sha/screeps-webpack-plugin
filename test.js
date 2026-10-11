const { createFsFromVolume, Volume } = require('memfs')
const ScreepsModules = require('screeps-modules')
const test = require('node:test')
const webpack = require('webpack')
const Compilation = require('webpack/lib/Compilation')

const ScreepsWebpackPlugin = require('./index')

const debug = require('debug')('screeps-webpack-plugin')

function compile (options) {
  const compiler = webpack(Object.assign({
    mode: 'none',
    target: 'node',
    entry: {
      main: ['index.js'],
      etc: ['foo.js', 'bar.js']
    },
    resolve: {
      modules: ['./fixtures']
    },
    output: {
      path: '/',
      filename: '[name]'
    },
    plugins: []
  }, options))
  compiler.outputFileSystem = createFsFromVolume(new Volume())

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      debug(stats.toJson())

      if (err) return reject(err)

      if (stats.hasErrors() || stats.hasWarnings()) {
        return reject(stats.compilation.errors)
      }

      resolve({ compiler, stats })
    })
  })
}

const plugin = (hook, method, fn) => (
  new (class {
    apply (compiler) {
      compiler.hooks.compilation.tap('TestPlugin', (compilation) => {
        ScreepsWebpackPlugin.getHooks(compilation)[hook][method]('TestPlugin', fn)
      })
    }
  })()
)

const checkError = (t, err, ...checks) => {
  t.assert.strictEqual(err.name, 'ScreepsWebpackPluginError')

  for (const check of checks) {
    t.assert.ok(err.toString().match(check))
  }
}

test('Test Webpack compiler setup', async t => {
  t.plan(1)

  class TestPlugin {
    apply (compiler) {
      compiler.hooks.done.tap('TestPlugin', () => {
        t.assert.ok(true)
      })
    }
  }

  await compile({ plugins: [new TestPlugin()] })
})

test("Test requires target 'node'", async t => {
  try {
    await compile({
      target: 'web',
      plugins: [
        new ScreepsWebpackPlugin()
      ]
    })

    t.assert.fail()
  } catch (errors) {
    t.assert.strictEqual(errors.length, 1)
    checkError(t, errors[0], 'target', 'node')
  }
})

test('Test commit', async t => {
  t.plan(10)

  const collectModules = plugin('collectModules', 'tapAsync',
    ({ modules, plugin, compilation }, cb) => {
      t.assert.deepStrictEqual(Object.keys(modules).sort(), ['etc', 'main'])
      t.assert.ok(modules.main.match(/foobar/))
      t.assert.ok(modules.etc.match(/foobar/))

      t.assert.ok(plugin instanceof ScreepsWebpackPlugin)
      t.assert.ok(compilation instanceof Compilation)

      modules.quux = 'norf'

      cb(null, { modules, plugin, compilation })
    }
  )

  const configureClient = plugin('configureClient', 'tap',
    (client, plugin) => {
      t.assert.ok(client instanceof ScreepsModules)
      t.assert.ok(plugin instanceof ScreepsWebpackPlugin)

      client.commit = (...args) => {
        return Promise.resolve('foobar')
      }

      return client
    }
  )

  const beforeCommit = plugin('beforeCommit', 'tap',
    (branch, modules) => {
      t.assert.strictEqual(branch, 'test')
      t.assert.strictEqual(modules.quux, 'norf')
    }
  )

  const afterCommit = plugin('afterCommit', 'tap',
    (body) => {
      t.assert.strictEqual(body, 'foobar')
    }
  )

  await compile({
    plugins: [
      new ScreepsWebpackPlugin({
        branch: 'test',
        email: 'foobar',
        password: 'barbaz',
        token: 'quuxnorf',
        serverUrl: 'https://foo.com',
        gzip: true
      }),
      collectModules,
      configureClient,
      beforeCommit,
      afterCommit
    ]
  })
})

test('Test plugin order', async t => {
  t.plan(2)

  const collectModules = plugin('collectModules', 'tapAsync',
    ({ modules, plugin, compilation }, cb) => {
      t.assert.deepStrictEqual(Object.keys(modules).sort(), ['etc', 'main'])

      cb(null, { modules, plugin, compilation })
    }
  )

  const configureClient = plugin('configureClient', 'tap',
    (client) => {
      t.assert.ok(client instanceof ScreepsModules)

      client.commit = () => Promise.resolve()

      return client
    }
  )

  await compile({
    plugins: [
      collectModules,
      configureClient,
      new ScreepsWebpackPlugin()
    ]
  })
})

test('Test commit source maps', async t => {
  t.plan(2)

  const configureClient = plugin('configureClient', 'tap',
    (client) => {
      client.commit = () => Promise.resolve()

      return client
    }
  )

  const beforeCommit = plugin('beforeCommit', 'tap',
    (branch, modules) => {
      t.assert.deepStrictEqual(Object.keys(modules).sort(), ['etc', 'etc.js.map', 'main', 'main.js.map'])
      t.assert.strictEqual(JSON.parse(modules['main.js.map']).file, 'main.js')
    }
  )

  await compile({
    devtool: 'source-map',
    output: {
      path: '/',
      filename: '[name].js'
    },
    plugins: [
      new ScreepsWebpackPlugin(),
      configureClient,
      beforeCommit
    ]
  })
})

test('Test commit failure', async t => {
  const configureClient = plugin('configureClient', 'tap',
    (client) => {
      client.commit = () => Promise.reject(new Error('nope'))

      return client
    }
  )

  try {
    await compile({
      plugins: [
        new ScreepsWebpackPlugin(),
        configureClient
      ]
    })

    t.assert.fail()
  } catch ([e]) {
    checkError(t, e, 'nope')
  }
})

test('Test constructor', t => {
  t.assert.doesNotThrow(() => new ScreepsWebpackPlugin())
  t.assert.ok(new ScreepsWebpackPlugin().options)
})
