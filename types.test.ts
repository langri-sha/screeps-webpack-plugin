import { expectTypeOf, test } from '@langri-sha/vitest'
import type { Compilation } from 'webpack'

import ScreepsWebpackPlugin from './index.js'

test('the plugin accepts the documented options', () => {
  const plugin = new ScreepsWebpackPlugin({
    branch: '$activeWorld',
    email: 'EMAIL',
    password: 'PASSWORD',
    token: 'TOKEN',
    serverUrl: 'https://screeps.com',
    serverPassword: 'SERVER_PASS',
    gzip: false,
  })

  expectTypeOf(plugin.options.branch).toEqualTypeOf<string | undefined>()
})

test('the plugin takes no options', () => {
  expectTypeOf(new ScreepsWebpackPlugin()).toHaveProperty('apply')
})

test('hooks are tapped per compilation', () => {
  const hooks = ScreepsWebpackPlugin.getHooks({} as Compilation)

  hooks.collectModules.tapAsync(
    'Test',
    ({ modules, plugin, compilation }, cb) => {
      expectTypeOf(modules).toEqualTypeOf<ScreepsWebpackPlugin.Modules>()
      expectTypeOf(plugin).toEqualTypeOf<ScreepsWebpackPlugin>()
      expectTypeOf(compilation).toEqualTypeOf<Compilation>()

      cb(null, { modules, plugin, compilation })
    },
  )

  hooks.configureClient.tap('Test', (client, plugin) => {
    expectTypeOf(plugin).toEqualTypeOf<ScreepsWebpackPlugin>()

    return client
  })

  hooks.beforeCommit.tap('Test', (branch, modules) => {
    expectTypeOf(branch).toEqualTypeOf<string | undefined>()
    expectTypeOf(modules).toEqualTypeOf<ScreepsWebpackPlugin.Modules>()
  })

  hooks.afterCommit.tap('Test', (body) => {
    expectTypeOf(body).toBeUnknown()
  })
})
