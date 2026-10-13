import fs from 'node:fs'
import path from 'node:path'

import createDebug from 'debug'
import ScreepsModules from 'screeps-modules'
import { AsyncSeriesWaterfallHook, SyncHook, SyncWaterfallHook } from 'tapable'
import type { Compilation, Compiler, WebpackError } from 'webpack'

const debug = createDebug('screeps-webpack-plugin')

const PLUGIN_NAME = 'ScreepsWebpackPlugin'

const compilationHooks = new WeakMap<Compilation, ScreepsWebpackPlugin.Hooks>()

interface CommittingClient {
  commit(
    branch: string | undefined,
    modules: ScreepsWebpackPlugin.Modules,
  ): Promise<unknown>
}

class ScreepsWebpackPluginError extends Error {
  constructor(msg?: string) {
    super(msg)
    this.name = 'ScreepsWebpackPluginError'
  }
}

class ScreepsWebpackPlugin {
  static getHooks(compilation: Compilation): ScreepsWebpackPlugin.Hooks {
    let hooks = compilationHooks.get(compilation)

    if (!hooks) {
      hooks = {
        collectModules: new AsyncSeriesWaterfallHook(['data']),
        configureClient: new SyncWaterfallHook(['client', 'plugin']),
        beforeCommit: new SyncHook(['branch', 'modules']),
        afterCommit: new SyncHook(['body']),
      }

      compilationHooks.set(compilation, hooks)
    }

    return hooks
  }

  options: ScreepsWebpackPlugin.Options

  constructor(options: ScreepsWebpackPlugin.Options = {}) {
    this.options = options
  }

  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      if (compiler.options.target !== 'node') {
        const err = new ScreepsWebpackPluginError(
          "Can only support Node.js {target: 'node'}",
        )

        compilation.errors.push(err as unknown as WebpackError)

        return
      }

      this.registerHandlers(compilation)
    })

    compiler.hooks.afterEmit.tapPromise(PLUGIN_NAME, (compilation) => {
      if (compiler.options.target !== 'node') {
        return Promise.resolve()
      }

      const hooks = ScreepsWebpackPlugin.getHooks(compilation)
      const initial: ScreepsWebpackPlugin.CollectModulesData = {
        modules: {},
        plugin: this,
        compilation,
      }

      return hooks.collectModules
        .promise(initial)
        .catch((err: Error) => {
          debug('Error while collecting modules', err.stack)

          throw err
        })
        .then(({ modules }) => {
          const client = hooks.configureClient.call(
            null as unknown as ScreepsWebpackPlugin.Client,
            this,
          ) as CommittingClient
          const { branch } = this.options

          hooks.beforeCommit.call(branch, modules)

          return client
            .commit(branch, modules)
            .then((body) => {
              hooks.afterCommit.call(body)
            })
            .catch((body: unknown) => {
              throw new Error(String(body))
            })
        })
        .catch((err: Error) => {
          compilation.errors.push(
            new ScreepsWebpackPluginError(err.stack) as unknown as WebpackError,
          )
        })
    })
  }

  private registerHandlers(compilation: Compilation): void {
    const hooks = ScreepsWebpackPlugin.getHooks(compilation)

    // Run before the taps of plugins listed ahead of this one.
    hooks.collectModules.tapAsync(
      { name: PLUGIN_NAME, stage: -100 },
      this.collectModules,
    )
    hooks.configureClient.tap(
      { name: PLUGIN_NAME, stage: -100 },
      this.configureClient,
    )
  }

  private collectModules(
    {
      modules: initial,
      plugin,
      compilation,
    }: ScreepsWebpackPlugin.CollectModulesData,
    cb: (
      err: Error | null,
      data?: ScreepsWebpackPlugin.CollectModulesData,
    ) => void,
  ): void {
    const outputPath = compilation.options.output.path as string
    const files: string[] = []

    for (const chunk of compilation.chunks) {
      for (const file of chunk.files) {
        const asset = compilation.getAsset(file)
        const related = (asset && asset.info.related) || {}

        files.push(path.resolve(outputPath, file))

        for (const sourceMap of [related.sourceMap || []].flat()) {
          files.push(path.resolve(outputPath, sourceMap))
        }
      }
    }

    const compilerFileSystem = compilation.compiler.outputFileSystem as {
      readFile?: typeof fs.readFile
    } | null
    const outputFileSystem =
      compilerFileSystem && compilerFileSystem.readFile
        ? (compilerFileSystem as Pick<typeof fs, 'readFile'>)
        : fs
    const promises: Promise<ScreepsWebpackPlugin.Modules>[] = []

    for (const file of files) {
      promises.push(
        new Promise((resolve, reject) => {
          outputFileSystem.readFile(file, 'utf-8', (err, data) => {
            if (err) {
              return reject(err)
            }

            const moduleName = path.basename(file, '.js')

            resolve({ [moduleName]: data })
          })
        }),
      )
    }

    Promise.all(promises)
      .then((files) => {
        const modules = files.reduce<ScreepsWebpackPlugin.Modules>(
          (modules, file) => {
            Object.assign(modules, file)

            return modules
          },
          initial || {},
        )

        cb(null, { modules, plugin, compilation })
      })
      .catch(cb)
  }

  private configureClient(
    _initial: ScreepsWebpackPlugin.Client,
    plugin: ScreepsWebpackPlugin,
  ): ScreepsWebpackPlugin.Client {
    return new ScreepsModules(plugin.options)
  }
}

namespace ScreepsWebpackPlugin {
  export type Modules = Record<string, string | { binary: string }>

  export interface Options {
    branch?: string
    email?: string
    password?: string
    token?: string
    serverUrl?: string
    serverPassword?: string
    gzip?: boolean
  }

  export interface Client {
    commit(
      ...args: [modules: Modules] | [branch: string, modules: Modules]
    ): Promise<unknown>
  }

  export interface CollectModulesData {
    modules: Modules
    plugin: ScreepsWebpackPlugin
    compilation: Compilation
  }

  export interface Hooks {
    collectModules: AsyncSeriesWaterfallHook<[CollectModulesData]>
    configureClient: SyncWaterfallHook<[Client, ScreepsWebpackPlugin]>
    beforeCommit: SyncHook<[string | undefined, Modules]>
    afterCommit: SyncHook<[unknown]>
  }
}

export default ScreepsWebpackPlugin

export { ScreepsWebpackPlugin as 'module.exports' }
