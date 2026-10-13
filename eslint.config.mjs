import defaults from '@langri-sha/eslint-config'

export default [
  ...defaults,
  { ignores: ['**/.*', '**/dist/', '!.projenrc.mts'] },
  {
    files: ['src/index.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
]
