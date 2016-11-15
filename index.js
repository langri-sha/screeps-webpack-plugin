
class ScreepsWebpackPluginError extends Error {
  constructor (msg) {
    super(msg)
    this.foo = 'bar'
    this.name = 'ScreepsWebpackPluginError'
  }
}

class ScreepsWebpackPlugin {
  apply (compiler) {
    compiler.plugin('compilation', (compilation) => {
      if (compiler.options.target !== 'node') {
        const err = new ScreepsWebpackPluginError(`Can only support Node.js {target: 'node'}`)

        return compilation.errors.push(err)
      }
    })
  }
}

module.exports = ScreepsWebpackPlugin
