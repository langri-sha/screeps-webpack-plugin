import MemoryFs from 'memory-fs'
import test from 'ava'
import webpack from 'webpack'

import ScreepsWebpackPlugin from './index'

function compile (options) {
  const compiler = webpack(Object.assign({
    target: 'node',
    entry: [
      'index.js'
    ],
    resolve: {
      modules: ['./fixtures']
    },
    output: {
      path: '/',
      filename: 'main'
    },
    plugins: []
  }, options))
  compiler.outputFileSystem = new MemoryFs()

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) return reject(err)

      if (stats.hasErrors() || stats.hasWarnings()) {
        return reject(new Error(stats.toString({
          errorDetails: true,
          warnings: true
        })))
      }

      resolve({compiler, stats})
    })
  })
}

test('Test Webpack compiler setup', async t => {
  t.plan(2)

  t.notThrows(async () => {
    await compile()
  })

  class TestPlugin {
    apply (compiler) {
      compiler.plugin('emit', (compilation, callback) => {
        t.pass()
        callback()
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
  } catch (e) {
    const msg = e.toString()

    t.true(msg.includes('screeps-webpack-plugin'))
    t.true(msg.includes('target'))
    t.true(msg.includes('node'))
  }
})

test('Test constructor', t => {
  t.truthy(new ScreepsWebpackPlugin())
})
