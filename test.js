import MemoryFs from 'memory-fs'
import ScreepsModules from 'screeps-modules'
import test from 'ava'
import webpack from 'webpack'
import Compilation from 'webpack/lib/Compilation'

import ScreepsWebpackPlugin from './index'

const debug = require('debug')('screeps-webpack-plugin')

function compile (options) {
  const compiler = webpack(Object.assign({
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
  compiler.outputFileSystem = new MemoryFs()

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      debug(stats.toJson())

      if (err) return reject(err)

      if (stats.hasErrors() || stats.hasWarnings()) {
        return reject(stats.compilation.errors)
      }

      resolve({compiler, stats})
    })
  })
}

const plugin = (name, ...args) => (
  new (class {
    apply (compiler) {
      compiler.plugin('compilation', (compilation) => {
        compilation.plugin(name, ...args)
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
      compiler.plugin('done', () => {
        t.pass()
      })
    }
  }

  await compile({plugins: [new TestPlugin()]})
})

test(`Test requires target 'node'`, async t => {
  try {
    await compile({
      target: 'web',
      plugins: [
        new ScreepsWebpackPlugin()
      ]
    })

    t.fail()
  } catch ([e]) {
    checkError(t, e, 'target', 'node')
  }
})

test('Test commit', async t => {
  t.plan(10)

  const collectModules = plugin('screeps-webpack-plugin-collect-modules',
    ({modules, plugin, compilation}, cb) => {
      t.deepEqual(Object.keys(modules), ['etc', 'main'])
      t.truthy(modules.main.match(/foobar/))
      t.truthy(modules.etc.match(/foobar/))

      t.true(plugin instanceof ScreepsWebpackPlugin)
      t.true(compilation instanceof Compilation)

      modules.quux = 'norf'

      cb(null, {modules, plugin, compilation})
    }
  )

  const configureClient = plugin('screeps-webpack-plugin-configure-client',
    (client, plugin) => {
      t.true(client instanceof ScreepsModules)
      t.true(plugin instanceof ScreepsWebpackPlugin)

      client.commit = (...args) => {
        return Promise.resolve('foobar')
      }

      return client
    }
  )

  const beforeCommit = plugin('screeps-webpack-plugin-before-commit',
    (branch, modules) => {
      t.is(branch, 'test')
      t.is(modules.quux, 'norf')
    }
  )

  const afterCommit = plugin('screeps-webpack-plugin-after-commit',
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

test('Test constructor', t => {
  t.notThrows(() => new ScreepsWebpackPlugin())
  t.truthy(new ScreepsWebpackPlugin().options)
})
