import type {
  AsyncSeriesWaterfallHook,
  SyncHook,
  SyncWaterfallHook,
} from 'tapable'
import type { Compilation, Compiler } from 'webpack'

declare namespace ScreepsWebpackPlugin {
  type Modules = Record<string, string | { binary: string }>

  interface Options {
    branch?: string
    email?: string
    password?: string
    token?: string
    serverUrl?: string
    serverPassword?: string
    gzip?: boolean
  }

  interface Client {
    commit(
      ...args: [modules: Modules] | [branch: string, modules: Modules]
    ): Promise<unknown>
  }

  interface CollectModulesData {
    modules: Modules
    plugin: ScreepsWebpackPlugin
    compilation: Compilation
  }

  interface Hooks {
    collectModules: AsyncSeriesWaterfallHook<[CollectModulesData]>
    configureClient: SyncWaterfallHook<[Client, ScreepsWebpackPlugin]>
    beforeCommit: SyncHook<[string | undefined, Modules]>
    afterCommit: SyncHook<[unknown]>
  }
}

declare class ScreepsWebpackPlugin {
  static getHooks(compilation: Compilation): ScreepsWebpackPlugin.Hooks

  options: ScreepsWebpackPlugin.Options

  constructor(options?: ScreepsWebpackPlugin.Options)

  apply(compiler: Compiler): void
}

export = ScreepsWebpackPlugin
