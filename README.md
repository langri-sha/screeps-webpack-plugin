# screeps-webpack-plugin

[![CI][ci-badge]][ci] [![NPM][npm-badge]][npm] ![Node version][node-badge]

Bundle and push your AI to Screeps servers!

For the official server, create an
[authentication token](https://docs.screeps.com/auth-tokens.html) with
permission to upload code. Supply it through the environment when deploying.

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

export default (env = {}) => {
  const deploy = env.deploy === true
  const token = process.env.SCREEPS_TOKEN

  if (deploy && !token) {
    throw new Error('Set SCREEPS_TOKEN before deploying')
  }

  return {
    mode: 'production',
    target: 'node',
    entry: { main: './src/main.js' },
    output: {
      path: fileURLToPath(new URL('./dist/', import.meta.url)),
      filename: '[name].js',
      library: { type: 'commonjs2' },
    },
    plugins: deploy
      ? [
          new ScreepsWebpackPlugin({
            token,
            branch: process.env.SCREEPS_BRANCH || '$activeWorld',
          }),
        ]
      : [],
  }
}
```

Build locally:

```sh
npx webpack --config webpack.config.mjs
```

Set `SCREEPS_TOKEN` in the environment and add `--env deploy` to upload:

```sh
npx webpack --config webpack.config.mjs --env deploy
```

`SCREEPS_BRANCH` selects the destination branch and defaults to `$activeWorld`.
The token is read by the configuration and is not bundled into the bot.

## Options

```js
new ScreepsWebpackPlugin({
  branch: '$activeWorld',
  token: process.env.SCREEPS_TOKEN ?? '',
  email: process.env.SCREEPS_EMAIL ?? '',
  password: process.env.SCREEPS_PASSWORD ?? '',
  serverUrl: 'https://screeps.com',
  serverPassword: process.env.SCREEPS_SERVER_PASSWORD ?? '',
  gzip: false,
})
```

Set a token or an email/password pair; leave unused credential variables unset.
Private-server support for tokens and compressed bundles depends on the
installed server modules.

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
