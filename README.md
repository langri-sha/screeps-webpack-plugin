# screeps-webpack-plugin

[![CI][ci-badge]][ci] [![NPM][npm-badge]][npm] ![Node version][node-badge]

Bundle and push your AI to Screeps servers!

If you have registered on the official server via Steam or GitHub, please go to
[account management](https://screeps.com/a/#!/account) and make sure you have
configured an email and password for your account to access your account on
https://screeps.com and https://screeps.com/ptr.

On private servers, make sure you have
[authorization enabled](https://github.com/screepsmods/screepsmod-auth) and that
the administrator has created your account.

## Installation

```sh
npm install --save-dev screeps-webpack-plugin webpack webpack-cli
```

The package requires Node.js 24.22.1 or later and webpack 5. It supports ES
module imports and CommonJS `require()`.

## Usage

Create `src/main.js` with the loop Screeps calls each tick:

```js
export function loop() {
  console.log(`Current tick: ${Game.time}`)
}
```

Use an ES module configuration in `webpack.config.mjs`. The plugin requires
`target: 'node'`. Screeps expects an output module named `main`; the `commonjs2`
library type exposes the loop through the exports it expects.

```js
import { fileURLToPath } from 'node:url'
import ScreepsWebpackPlugin from 'screeps-webpack-plugin'

export default {
  mode: 'production',
  target: 'node',
  entry: { main: './src/main.js' },
  output: {
    path: fileURLToPath(new URL('./dist/', import.meta.url)),
    filename: '[name].js',
    library: { type: 'commonjs2' },
  },
  plugins: [
    new ScreepsWebpackPlugin({
      token: process.env.SCREEPS_TOKEN,
      branch: process.env.SCREEPS_BRANCH ?? '$activeWorld',
    }),
  ],
}
```

Set `SCREEPS_TOKEN` in the environment, then build and upload:

```sh
npx webpack --config webpack.config.mjs
```

## Options

```js
new ScreepsWebpackPlugin({
  branch: '$activeWorld',
  email: 'EMAIL',
  password: 'PASSWORD',
  token: 'TOKEN',
  serverUrl: 'https://screeps.com',
  serverPassword: 'SERVER_PASS',
  gzip: false,
})
```

If your server modules provide support, you can use tokens for authentication
and send compressed bundles.

See [screeps-modules#Usage](https://github.com/langri-sha/screeps-modules#usage)
for more information.

## Hooks

The plugin adds [tapable](https://github.com/webpack/tapable) hooks to each
compilation, which your own plugins can tap into.

```js
import ScreepsWebpackPlugin from 'screeps-webpack-plugin'

compiler.hooks.compilation.tap('MyPlugin', (compilation) => {
  const hooks = ScreepsWebpackPlugin.getHooks(compilation)

  // ...
})
```

##### `collectModules`

Asynchronously alter the modules which will be pushed to the server.

```js
hooks.collectModules.tapAsync(
  'MyPlugin',
  ({ modules, plugin, compilation }, cb) => {
    // ...
    cb(null, { modules, plugin, compilation })
  },
)
```

##### `configureClient`

Configure the client used for the request.

```js
hooks.configureClient.tap('MyPlugin', (client, plugin) => {
  // ...
  return client
})
```

##### `beforeCommit`

Inspect request data.

```js
hooks.beforeCommit.tap('MyPlugin', (branch, modules) => {
  // ...
})
```

##### `afterCommit`

Inspect the response body of the commit.

```js
hooks.afterCommit.tap('MyPlugin', (body) => {
  // ...
})
```

## Troubleshooting

The plugin only provides opaque access to the response body, so that it can be
safely used in CI. To debug, run with `DEBUG=* webpack $ARGS`.

## Contributing

Share your feedback, bugs and PRs on the
[issues tracker](https://github.com/langri-sha/screeps-webpack-plugin/issues).

[ci]:
  https://github.com/langri-sha/screeps-webpack-plugin/actions/workflows/workspace.yml
[ci-badge]:
  https://github.com/langri-sha/screeps-webpack-plugin/actions/workflows/workspace.yml/badge.svg
[npm]: https://www.npmjs.com/package/screeps-webpack-plugin
[npm-badge]: https://img.shields.io/npm/v/screeps-webpack-plugin.svg
[node-badge]: https://img.shields.io/node/v/screeps-webpack-plugin.svg
