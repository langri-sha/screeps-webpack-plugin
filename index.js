const debug = require('debug')('screeps-webpack-plugin')
const path = require('path')
const fs = require('fs')
const {
  SyncHook,
  SyncBailHook,
  SyncWaterfallHook,
  SyncLoopHook,
  AsyncParallelHook,
  AsyncParallelBailHook,
  AsyncSeriesHook,
  AsyncSeriesBailHook,
  AsyncSeriesWaterfallHook
 } = require("tapable");

const ScreepsModules = require('screeps-modules')

// Events.
const COLLECT_MODULES = 'screeps-webpack-plugin-collect-modules'
const CONFIG_CLIENT = 'screeps-webpack-plugin-configure-client'
const BEFORE_COMMIT = 'screeps-webpack-plugin-before-commit'
const AFTER_COMMIT = 'screeps-webpack-plugin-after-commit'

const pluginName = 'ScreepsWebpackPlugin'

class ScreepsWebpackPluginError extends Error {
  constructor (msg) {
    super(msg)
    this.name = 'ScreepsWebpackPluginError'
  }
}

class ScreepsWebpackPlugin {
  constructor (options = {}) {
    this.options = options;
  }

  apply (compiler) {
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      // compiler.options not supported in webpack 4

      // if (compiler.options.target !== 'node') {
      //   const err = new ScreepsWebpackPluginError(`Can only support Node.js {target: 'node'}`)

      //   return compilation.errors.push(err)
      // }

      this.registerHandlers(compilation)
    })

    compiler.hooks.afterEmit.tapAsync(pluginName, (compilation, cb) => {
      Promise.resolve()
        .then(() => {
          return new Promise((resolve, reject) => {
            const initial = {
              modules: {},
              plugin: this,
              compilation
            }

            compilation.hooks[COLLECT_MODULES].callAsync(initial, (err, obj) => {
              if (err) {
                debug('Error while collecting modules', err.stack)

                return reject(err)
              } else {
                resolve(obj.modules)
              }
            })
          })
        })
      .then((modules) => {
        const client = compilation.hooks[CONFIG_CLIENT].call(null, this)
        const {branch} = this.options

        compilation.hooks[BEFORE_COMMIT].call(branch, modules)

        return client.commit(branch, modules)
          .then((body) => {
            compilation.hooks[AFTER_COMMIT].call(body)
          })
          .catch((body) => {
            throw new Error(body)
          })
      })
      .then(cb)
      .catch((err) => {
        compilation.errors.push(new ScreepsWebpackPluginError(err.stack))

        cb()
      })
    })
  }

  registerHandlers (compilation) {
    compilation.hooks[COLLECT_MODULES] = new AsyncSeriesWaterfallHook(["opts"]);
    compilation.hooks[CONFIG_CLIENT] = new SyncWaterfallHook(["initial", "plugin"]);
    compilation.hooks[BEFORE_COMMIT] = new SyncHook(["branch", "modules"]);
    compilation.hooks[AFTER_COMMIT] = new SyncHook(["body"]);

    compilation.hooks[COLLECT_MODULES].tapAsync(pluginName, this.collectModules);
    compilation.hooks[CONFIG_CLIENT].tap(pluginName, this.configureClient);
  }

  collectModules ({modules: initial, plugin, compilation}, cb) {
    const chunks = compilation.getStats().toJson().chunks
    const outputPath = compilation.options.output.path
    const files = []

    for (const chunk of chunks) {
      for (const file of chunk.files) {
        files.push(path.resolve(outputPath, file))
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

          resolve({[moduleName]: data})
        })
      }))
    }

    Promise.all(promises)
      .then((files) => {
        const modules = files.reduce((modules, file) => {
          Object.assign(modules, file)

          return modules
        }, initial || {})

        cb(null, {modules, plugin, compilation})
      })
      .catch((err) => cb(err, {modules:null}))
  }

  configureClient (initial, plugin) {
    return new ScreepsModules(plugin.options)
  }
}

Object.assign(ScreepsWebpackPlugin, {
  COLLECT_MODULES,
  CONFIG_CLIENT,
  BEFORE_COMMIT,
  AFTER_COMMIT
})

module.exports = ScreepsWebpackPlugin
