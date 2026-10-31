# Change Log - screeps-webpack-plugin

<!-- This log was last generated on Sat, 31 Oct 2026 17:00:50 GMT and should not be manually modified. -->

<!-- Start content -->

## 2.1.0

Sat, 31 Oct 2026 17:00:50 GMT

### Minor changes

- Require Node.js 24.22.1, which fixes CVE-2026-111497 (filip.dupanovic@gmail.com)

### Patches

- Update dependency webpack to v5.112.1
- Update dependency webpack to v5.112.0
- Update dependency @langri-sha/eslint-config to v0.10.0
- Update dependency @langri-sha/projen-project to v0.40.0
- Update vitest monorepo to v5.0.4
- Update dependency langri-sha/skills to v1.1.0
- Update dependency pnpm to v12.16.1
- Update dependency @langri-sha/projen-project to v0.42.0
- Update dependency @langri-sha/projen-project to v0.43.0
- Update dependency @types/debug to v4.1.13
- Update langri-sha/skills digest to 8be1a50
- Update dependency @types/node to v24.19.2
- Update dependency pnpm to v12.15.0
- Update dependency pnpm to v12.16.0
- Update dependency @langri-sha/projen-project to v0.39.0
- Update vitest monorepo to v5.0.5
- Update dependency pnpm to v12.14.0
- Update dependency pnpm to v12.13.0
- Update dependency webpack to v5.112.2
- Update dependency @langri-sha/projen-project to v0.42.4

## 2.0.0

Tue, 13 Oct 2026 23:52:48 GMT

### Major changes

- Require webpack 5 and Node.js 24. Replace the `screeps-webpack-plugin-*` events with hooks from `ScreepsWebpackPlugin.getHooks(compilation)`, removing the `COLLECT_MODULES`, `CONFIG_CLIENT`, `BEFORE_COMMIT` and `AFTER_COMMIT` constants. Plugins listed ahead of this one get the client and the collected modules. Ship type declarations. (filip.dupanovic@gmail.com)
- Port the plugin to TypeScript and ESM; require() keeps returning the plugin class. (filip.dupanovic@gmail.com)

### Patches

- Update dependency @langri-sha/projen-project to v0.38.2
- Update dependency screeps-modules to v2
- Publish the compiled build from dist, with generated declarations. (filip.dupanovic@gmail.com)

## [1.3.0] - 2017-05-15
### Added
- Allow use of module with `.js` extension @bryanbecker #28

### Changed
- Improvements to the `README` @pranaygp @elgervb

## [1.2.0] - 2017-04-08
### Added
- Note for `serverPassword` option

### Changed
- Updated development dependencies

## [1.1.0] - 2016-11-18
### Changed
- Updated dependencies

## [1.0.1] - 2016-11-17
### Added
- Support for pushing modules on build

[Unreleased]: https://github.com/langri-sha/screeps-webpack-plugin/commits/main
[1.3.0]: https://github.com/langri-sha/screeps-webpack-plugin/compare/1.2.0...v1.3.0
[1.2.0]: https://github.com/langri-sha/screeps-webpack-plugin/compare/1.1.0...v1.2.0
[1.1.0]: https://github.com/langri-sha/screeps-webpack-plugin/compare/1.0.1...v1.1.0
[1.0.1]: https://github.com/langri-sha/screeps-webpack-plugin/compare/107769c...v1.0.1

[#28]: https://github.com/langri-sha/screeps-webpack-plugin/pull/28
