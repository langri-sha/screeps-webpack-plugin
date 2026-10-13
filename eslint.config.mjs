import defaults from '@langri-sha/eslint-config'

export default [
  ...defaults,
  { ignores: ['**/.*', '**/dist/', '!.projenrc.mts'] },
  {
    files: ['index.js', 'test.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
]
