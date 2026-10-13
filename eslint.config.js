import defaults from '@langri-sha/eslint-config'

export default [
  ...defaults,
  { ignores: ['**/.*', '**/dist/', '!.projenrc.ts'] },
]
