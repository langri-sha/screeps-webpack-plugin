import { expect, test } from '@langri-sha/vitest'
import createDebug from 'debug'
import { Volume, createFsFromVolume } from 'memfs'
import ScreepsModules from 'screeps-modules'
import webpack, {
  Compilation,
  type Compiler,
  type Configuration,
  type Stats,
} from 'webpack'

import ScreepsWebpackPlugin from './index.js'

const debug = createDebug('screeps-webpack-plugin')

interface Compiled {
  compiler: Compiler
  stats: Stats
}

function compile(options: Configuration): Promise<Compiled> {
  const compiler = webpack(
    Object.assign(
      {
        mode: 'none',
        target: 'node',
        entry: {
          main: ['index.js'],
          etc: ['foo.js', 'bar.js'],
        },
        resolve: {
          modules: ['./fixtures'],
        },
        output: {
          path: '/',
          filename: '[name]',
        },
        plugins: [],
      },
      options,
    ),
  )
  compiler.outputFileSystem = createFsFromVolume(
    new Volume(),
  ) as unknown as Compiler['outputFileSystem']

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err || !stats) return reject(err)

      debug(stats.toJson())

      if (stats.hasErrors() || stats.hasWarnings()) {
        return reject(stats.compilation.errors)
      }

      resolve({ compiler, stats })
    })
  })
}

interface HookCallbacks {
  collectModules: (
    data: ScreepsWebpackPlugin.CollectModulesData,
    cb: (
      err: Error | null,
      data?: ScreepsWebpackPlugin.CollectModulesData,
    ) => void,
  ) => void
  configureClient: (
    client: ScreepsWebpackPlugin.Client,
    plugin: ScreepsWebpackPlugin,
  ) => ScreepsWebpackPlugin.Client
  beforeCommit: (
    branch: string | undefined,
    modules: ScreepsWebpackPlugin.Modules,
  ) => void
  afterCommit: (body: unknown) => void
}

const plugin = <Hook extends keyof HookCallbacks>(
  hook: Hook,
  method: 'tap' | 'tapAsync',
  fn: HookCallbacks[Hook],
) =>
  new (class {
    apply(compiler: Compiler) {
      compiler.hooks.compilation.tap('TestPlugin', (compilation) => {
        const hooks = ScreepsWebpackPlugin.getHooks(compilation)[
          hook
        ] as unknown
        const tapper = hooks as Record<
          typeof method,
          (name: string, fn: unknown) => void
        >

        tapper[method]('TestPlugin', fn)
      })
    }
  })()

const checkError = (err: Error, ...checks: Array<string | RegExp>) => {
  expect(err.name).toBe('ScreepsWebpackPluginError')

  for (const check of checks) {
    expect(err.toString()).toMatch(check)
  }
}

test('compiles with an unrelated plugin', async () => {
  expect.assertions(1)

  class TestPlugin {
    apply(compiler: Compiler) {
      compiler.hooks.done.tap('TestPlugin', () => {
        expect(true).toBe(true)
      })
    }
  }

  await compile({ plugins: [new TestPlugin()] })
})

test("reports an error when the target is not 'node'", async () => {
  const errors = await compile({
    target: 'web',
    plugins: [new ScreepsWebpackPlugin()],
  }).catch((errors) => errors)

  expect(errors).toHaveLength(1)
  checkError(errors[0], 'target', 'node')
})

test('commits the collected modules through the configured client', async () => {
  expect.assertions(10)

  const collectModules = plugin(
    'collectModules',
    'tapAsync',
    ({ modules, plugin, compilation }, cb) => {
      expect(Object.keys(modules).sort()).toEqual(['etc', 'main'])
      expect(modules.main).toMatch(/foobar/)
      expect(modules.etc).toMatch(/foobar/)

      expect(plugin).toBeInstanceOf(ScreepsWebpackPlugin)
      expect(compilation).toBeInstanceOf(Compilation)

      modules.quux = 'norf'

      cb(null, { modules, plugin, compilation })
    },
  )

  const configureClient = plugin('configureClient', 'tap', (client, plugin) => {
    expect(client).toBeInstanceOf(ScreepsModules)
    expect(plugin).toBeInstanceOf(ScreepsWebpackPlugin)

    client.commit = () => {
      return Promise.resolve('foobar')
    }

    return client
  })

  const beforeCommit = plugin('beforeCommit', 'tap', (branch, modules) => {
    expect(branch).toBe('test')
    expect(modules.quux).toBe('norf')
  })

  const afterCommit = plugin('afterCommit', 'tap', (body) => {
    expect(body).toBe('foobar')
  })

  await compile({
    plugins: [
      new ScreepsWebpackPlugin({
        branch: 'test',
        email: 'foobar',
        password: 'barbaz',
        token: 'quuxnorf',
        serverUrl: 'https://foo.com',
        gzip: true,
      }),
      collectModules,
      configureClient,
      beforeCommit,
      afterCommit,
    ],
  })
})

test('runs ahead of the plugins listed before it', async () => {
  expect.assertions(2)

  const collectModules = plugin(
    'collectModules',
    'tapAsync',
    ({ modules, plugin, compilation }, cb) => {
      expect(Object.keys(modules).sort()).toEqual(['etc', 'main'])

      cb(null, { modules, plugin, compilation })
    },
  )

  const configureClient = plugin('configureClient', 'tap', (client) => {
    expect(client).toBeInstanceOf(ScreepsModules)

    client.commit = () => Promise.resolve()

    return client
  })

  await compile({
    plugins: [collectModules, configureClient, new ScreepsWebpackPlugin()],
  })
})

test('commits the source maps next to the modules', async () => {
  expect.assertions(2)

  const configureClient = plugin('configureClient', 'tap', (client) => {
    client.commit = () => Promise.resolve()

    return client
  })

  const beforeCommit = plugin('beforeCommit', 'tap', (_branch, modules) => {
    expect(Object.keys(modules).sort()).toEqual([
      'etc',
      'etc.js.map',
      'main',
      'main.js.map',
    ])
    expect(JSON.parse(modules['main.js.map'] as string).file).toBe('main.js')
  })

  await compile({
    devtool: 'source-map',
    output: {
      path: '/',
      filename: '[name].js',
    },
    plugins: [new ScreepsWebpackPlugin(), configureClient, beforeCommit],
  })
})

test('reports a failed commit as a compilation error', async () => {
  const configureClient = plugin('configureClient', 'tap', (client) => {
    client.commit = () => Promise.reject(new Error('nope'))

    return client
  })

  const errors = await compile({
    plugins: [new ScreepsWebpackPlugin(), configureClient],
  }).catch((errors) => errors)

  expect(errors).toHaveLength(1)
  checkError(errors[0], 'nope')
})

test('constructs without options', () => {
  expect(() => new ScreepsWebpackPlugin()).not.toThrow()
  expect(new ScreepsWebpackPlugin().options).toBeTruthy()
})
