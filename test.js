const { createFsFromVolume, Volume } = require('memfs')
const ScreepsModules = require('screeps-modules')
const test = require('ava').default
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
  t.is(err.name, 'ScreepsWebpackPluginError')

  for (const check of checks) {
    t.truthy(err.toString().match(check))
  }
}

test('Test Webpack compiler setup', async t => {
  t.plan(1)

  class TestPlugin {
    apply (compiler) {
      compiler.hooks.done.tap('TestPlugin', () => {
        t.pass()
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

    t.fail()
  } catch (errors) {
    t.is(errors.length, 1)
    checkError(t, errors[0], 'target', 'node')
  }
})

test('Test commit', async t => {
  t.plan(10)

  const collectModules = plugin('collectModules', 'tapAsync',
    ({ modules, plugin, compilation }, cb) => {
      t.deepEqual(Object.keys(modules).sort(), ['etc', 'main'])
      t.truthy(modules.main.match(/foobar/))
      t.truthy(modules.etc.match(/foobar/))

      t.true(plugin instanceof ScreepsWebpackPlugin)
      t.true(compilation instanceof Compilation)

      modules.quux = 'norf'

      cb(null, { modules, plugin, compilation })
    }
  )

  const configureClient = plugin('configureClient', 'tap',
    (client, plugin) => {
      t.true(client instanceof ScreepsModules)
      t.true(plugin instanceof ScreepsWebpackPlugin)

      client.commit = (...args) => {
        return Promise.resolve('foobar')
      }

      return client
    }
  )

  const beforeCommit = plugin('beforeCommit', 'tap',
    (branch, modules) => {
      t.is(branch, 'test')
      t.is(modules.quux, 'norf')
    }
  )

  const afterCommit = plugin('afterCommit', 'tap',
    (body) => {
      t.is(body, 'foobar')
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
      t.deepEqual(Object.keys(modules).sort(), ['etc', 'etc.js.map', 'main', 'main.js.map'])
      t.is(JSON.parse(modules['main.js.map']).file, 'main.js')
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

    t.fail()
  } catch ([e]) {
    checkError(t, e, 'nope')
  }
})

test('Test constructor', t => {
  t.notThrows(() => new ScreepsWebpackPlugin())
  t.truthy(new ScreepsWebpackPlugin().options)
})
