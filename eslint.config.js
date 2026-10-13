import defaults from '@langri-sha/eslint-config'

export default [
  ...defaults,
  { ignores: ['**/.*', '**/dist/', '!.projenrc.ts'] },
  {
    files: ['src/index.ts'],
    rules: { '@typescript-eslint/no-namespace': 'off' },
  },
]
