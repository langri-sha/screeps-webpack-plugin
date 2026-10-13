import { Project } from '@langri-sha/projen-project'

const project = new Project({
  name: 'screeps-webpack-plugin',
  package: {
    authorEmail: 'filip.dupanovic@gmail.com',
    authorName: 'Filip Dupanović',
    authorOrganization: false,
    bugsUrl: 'https://github.com/langri-sha/screeps-webpack-plugin/issues',
    copyrightYear: '2016',
    description: 'Compile your AI against a Screeps server',
    entrypoint: 'index.js',
    homepage: 'https://github.com/langri-sha/screeps-webpack-plugin#readme',
    keywords: [
      'branch',
      'branches',
      'commit',
      'plugin',
      'screeps',
      'webpack',
      'webpackplugin',
    ],
    license: 'MIT',
    licensed: true,
    minNodeVersion: '24.0.0',
    peerDependencyOptions: {
      pinnedDevDependency: false,
    },
    repository: 'git+https://github.com/langri-sha/screeps-webpack-plugin.git',

    deps: ['debug@^4.0.0', 'screeps-modules@^1.1.1', 'tapable@^2.0.0'],
    devDeps: [
      '@langri-sha/eslint-config@0.9.19',
      '@langri-sha/lint-staged@0.9.11',
      '@langri-sha/prettier@0.4.11',
      'c8@^12.0.0',
      'memfs@^4.80.0',
      'webpack@5.111.1',
    ],
    peerDeps: ['webpack@^5.0.0'],
  },
  codeowners: {
    '*': '@langri-sha',
  },
  editorConfig: {},
  eslint: {
    config: [
      {
        files: ['index.js', 'test.js'],
        rules: { '@typescript-eslint/no-require-imports': 'off' },
      },
    ],
  },
  husky: {
    'pre-commit': 'lint-staged',
  },
  lintStaged: {},
  lintSynthesized: {},
  npmIgnore: {
    ignorePatterns: [
      '/*.config.*',
      '/*.yaml',
      '/CODEOWNERS',
      '/coverage/',
      '/fixtures/',
      '/renovate.json',
      '/test.js',
    ],
  },
  prettier: {
    ignorePatterns: ['CHANGELOG.md'],
  },
  pnpmWorkspace: {
    minimumReleaseAgeExclude: ['@langri-sha/*', ...Project.presetPackages],
  },
  worktrunk: {},
})

project.gitignore.addPatterns('coverage/')

project.package?.addField('packageManager', 'pnpm@12.11.2')

project.package?.setScript('start', 'pnpm run -s lint; pnpm run -s test')
project.package?.setScript('test', 'c8 node --test test.js')
project.package?.setScript('lint', 'eslint .')

project.synth()
