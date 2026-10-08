const debug = require('debug')('screeps-webpack-plugin')
const path = require('path')
const fs = require('fs')
const { AsyncSeriesWaterfallHook, SyncHook, SyncWaterfallHook } = require('tapable')

const ScreepsModules = require('screeps-modules')

const PLUGIN_NAME = 'ScreepsWebpackPlugin'

const compilationHooks = new WeakMap()

class ScreepsWebpackPluginError extends Error {
  constructor (msg) {
    super(msg)
    this.name = 'ScreepsWebpackPluginError'
  }
}

class ScreepsWebpackPlugin {
  static getHooks (compilation) {
    let hooks = compilationHooks.get(compilation)

    if (!hooks) {
      hooks = {
        collectModules: new AsyncSeriesWaterfallHook(['data']),
        configureClient: new SyncWaterfallHook(['client', 'plugin']),
        beforeCommit: new SyncHook(['branch', 'modules']),
        afterCommit: new SyncHook(['body'])
      }

      compilationHooks.set(compilation, hooks)
    }

    return hooks
  }

  constructor (options = {}) {
    this.options = options
  }

  apply (compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      if (compiler.options.target !== 'node') {
        const err = new ScreepsWebpackPluginError("Can only support Node.js {target: 'node'}")

        return compilation.errors.push(err)
      }

      this.registerHandlers(compilation)
    })

    compiler.hooks.afterEmit.tapPromise(PLUGIN_NAME, (compilation) => {
      if (compiler.options.target !== 'node') {
        return Promise.resolve()
      }

      const hooks = ScreepsWebpackPlugin.getHooks(compilation)
      const initial = {
        modules: {},
        plugin: this,
        compilation
      }

      return hooks.collectModules.promise(initial)
        .catch((err) => {
          debug('Error while collecting modules', err.stack)

          throw err
        })
        .then(({ modules }) => {
          const client = hooks.configureClient.call(null, this)
          const { branch } = this.options

          hooks.beforeCommit.call(branch, modules)

          return client.commit(branch, modules)
            .then((body) => {
              hooks.afterCommit.call(body)
            })
            .catch((body) => {
              throw new Error(body)
            })
        })
        .catch((err) => {
          compilation.errors.push(new ScreepsWebpackPluginError(err.stack))
        })
    })
  }

  registerHandlers (compilation) {
    const hooks = ScreepsWebpackPlugin.getHooks(compilation)

    hooks.collectModules.tapAsync(PLUGIN_NAME, this.collectModules)
    hooks.configureClient.tap(PLUGIN_NAME, this.configureClient)
  }

  collectModules ({ modules: initial, plugin, compilation }, cb) {
    const outputPath = compilation.options.output.path
    const files = []

    for (const chunk of compilation.chunks) {
      for (const file of chunk.files) {
        const asset = compilation.getAsset(file)
        const related = (asset && asset.info.related) || {}

        files.push(path.resolve(outputPath, file))

        for (const sourceMap of [].concat(related.sourceMap || [])) {
          files.push(path.resolve(outputPath, sourceMap))
        }
      }
    }

    const outputFileSystem = (
      compilation.compiler.outputFileSystem.readFile
        ? compilation.compiler.outputFileSystem
        : fs
    )
    const promises = []

    for (const file of files) {
      promises.push(new Promise((resolve, reject) => {
        outputFileSystem.readFile(file, 'utf-8', (err, data) => {
          if (err) {
            return reject(err)
          }

          const moduleName = path.basename(file, '.js')

          resolve({ [moduleName]: data })
        })
      }))
    }

    Promise.all(promises)
      .then((files) => {
        const modules = files.reduce((modules, file) => {
          Object.assign(modules, file)

          return modules
        }, initial || {})

        cb(null, { modules, plugin, compilation })
      })
      .catch(cb)
  }

  configureClient (initial, plugin) {
    return new ScreepsModules(plugin.options)
  }
}

module.exports = ScreepsWebpackPlugin
