# screeps-webpack-plugin

[![NPM][npm-badge]][npm] [![Build status][travis-ci-badge]][travis-ci]

Bundle and push your AI to Screeps servers!

If you have registered on the official server via Steam or GitHub, please go to [account management](https://screeps.com/a/#!/account) and make sure you have configured an email and password for your account to access your account on https://screeps.com and https://screeps.com/ptr.

On private servers, make sure you have [authorization enabled](https://github.com/screepsmods/screepsmod-auth) and that an administrator has created your account.

## Installation

```
npm install screeps-webpack-plugin
```

## Usage

Add the plugin to your Webpack configuration.

Make sure you are using `{target: 'node'}`, other environments aren't supported. You should have at least one chunk named `main` in the output.

```
// webpack.config.js
import ScreepsWebpackPlugin from 'screeps-webpack-plugin'

module.exports = {
  target: 'node',
  entry: 'index.js'
  output: {
    path: 'dist',
    filename: 'main'
  },
  plugins: [new ScreepsWebpackPlugin(options)]
}
```

## Options

```
new ScreepsWebpackPlugin({
  branch: '$activeWorld',
  email: 'EMAIL',
  password: 'PASSWORD',
  token: 'TOKEN',
  serverUrl: 'https://screeps.com',
  gzip: false
})
```

If your server modules provide support, you can use tokens for authentication and send compressed bundles.

See [screeps-modules#Usage](https://github.com/langri-sha/screeps-modules#usage) for more information.

## Events

##### `screeps-webpack-plugin-collect-modules`

Asynchronously alter the modules which will be pushed to the server.

```
compilation.plugin(
  'screeps-webpack-plugin-collect-modules', ({modules, plugin, compilation}, cb) => {
    //...
    cb(null, {modules, plugin, compilation})
  }
)
```

##### `screeps-webpack-plugin-configure-client`

Configure the client used for the request.

```
compilation.plugin(
  'screeps-webpack-plugin-configure-client', (client, plugin) => {
    //...
    return client
  }
)
```

##### `screeps-webpack-plugin-before-commit`

Inspect request data.

```
compilation.plugin(
  'screeps-webpack-plugin-before-commit', (branch, modules) => {
    // ...
  }
)
```

##### `screeps-webpack-plugin-after-commit`

Inspect the response body of the commit.

```
compilation.plugin(
  'screeps-webpack-plugin-after-commit', (body) => {
    //..
  }
)
```

## Troubleshooting

The plugin only provides opaque access to the response body, so that it can be safely used in CI. To debug, run with `DEBUG=* webpack $ARGS`.

## Contributing

Share your feedback, bugs and PRs on the [issues tracker](https://github.com/langri-sha/screeps-webpack-plugin/issues).

[npm]: https://www.npmjs.com/pack1age/screeps-webpack-plugin
[npm-badge]: https://img.shields.io/npm/v/screeps-webpack-plugin.svg
[travis-ci]: https://travis-ci.org/langri-sha/screeps-webpack-plugin
[travis-ci-badge]: https://travis-ci.org/langri-sha/screeps-webpack-plugin.svg?branch=master
