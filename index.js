const debug = require('debug')('screeps-webpack-plugin')
const path = require('path')
const fs = require('fs')

const ScreepsModules = require('screeps-modules')

// Events.
const COLLECT_MODULES = 'screeps-webpack-plugin-collect-modules'
const CONFIG_CLIENT = 'screeps-webpack-plugin-configure-client'
const BEFORE_COMMIT = 'screeps-webpack-plugin-before-commit'
const AFTER_COMMIT = 'screeps-webpack-plugin-after-commit'

class ScreepsWebpackPluginError extends Error {
  constructor (msg) {
    super(msg)
    this.name = 'ScreepsWebpackPluginError'
  }
}

class ScreepsWebpackPlugin {
  constructor (options = {}) {
    this.options = options
  }

  apply (compiler) {
    compiler.plugin('compilation', (compilation) => {
      if (compiler.options.target !== 'node') {
        const err = new ScreepsWebpackPluginError(`Can only support Node.js {target: 'node'}`)

        return compilation.errors.push(err)
      }

      this.registerHandlers(compilation)
    })

    compiler.plugin('after-emit', (compilation, cb) => {
      Promise.resolve()
        .then(() => {
          return new Promise((resolve, reject) => {
            const initial = {
              modules: {},
              plugin: this,
              compilation
            }

            compilation.applyPluginsAsyncWaterfall(COLLECT_MODULES, initial, (err, {modules}) => {
              if (err) {
                debug('Error while collecting modules', err.stack)

                return reject(err)
              } else {
                resolve(modules)
              }
            })
          })
        })
      .then((modules) => {
        const client = compilation.applyPluginsWaterfall(CONFIG_CLIENT, null, this)
        const {branch} = this.options

        compilation.applyPlugins(BEFORE_COMMIT, branch, modules)

        return client.commit(branch, modules)
          .then((body) => {
            compilation.applyPlugins(AFTER_COMMIT, body)
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
    compilation.plugin(COLLECT_MODULES, this.collectModules)
    compilation.plugin(CONFIG_CLIENT, this.configureClient)
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

          const moduleName = path.parse(file).name

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
      .catch(cb)
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
