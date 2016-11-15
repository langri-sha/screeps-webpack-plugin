module.exports = class ScreepsWebpackPlugin {
  apply (compiler) {
    compiler.plugin('compilation', (compilation) => {
      if (compiler.options.target !== 'node') {
        return compilation.errors.push(new Error(`[screeps-webpack-plugin] Can only support Node.js {target: 'node'}`))
      }
    })
  }
}
