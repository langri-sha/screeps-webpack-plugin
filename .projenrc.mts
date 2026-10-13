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
      '@langri-sha/tsconfig@1.1.1',
      '@langri-sha/vitest@0.2.3',
      '@vitest/coverage-v8@5.0.3',
      'memfs@^4.80.0',
      'vitest@5.0.3',
      'webpack@5.111.1',
    ],
    peerDeps: ['webpack@^5.0.0'],
  },
  beachball: {
    config: {
      branch: 'origin/main',
      ignorePatterns: [
        '.editorconfig',
        '.gitattributes',
        '.gitignore',
        '.prettierignore',
        '.projenrc.mts',
        'CODEOWNERS',
        'beachball.config.js',
        'dagger.lock',
        'dagger.toml',
        'eslint.config.mjs',
        'lint-staged.config.mjs',
        'pnpm-lock.yaml',
        'pnpm-workspace.yaml',
        'prettier.config.mjs',
        'renovate.json5',
        'tsconfig.json',
        'types.test.ts',
      ],
    },
  },
  codeowners: {
    '*': '@langri-sha',
  },
  dagger: {
    engineVersion: 'v1.0.0-beta.16',
    workspace: {
      ignore: ['**/node_modules', '**/dist', '**/coverage', '**/*.tsbuildinfo'],
      modules: {
        ci: {
          source: 'github.com/langri-sha/dagger/ci@ci/v0.1.0',
        },
        eslint: {
          source: 'dagger.io/js/eslint',
          settings: {
            baseImageAddress: 'node:24-slim',
            packageManager: 'pnpm',
          },
        },
        prettier: {
          source: 'dagger.io/js/prettier',
          settings: {
            baseImageAddress: 'node:24-slim',
            packageManager: 'pnpm',
          },
        },
        vitest: {
          source: 'dagger.io/js/vitest',
          settings: {
            baseImageAddress: 'node:24-slim',
            packageManager: 'pnpm',
          },
        },
      },
    },
  },
  editorConfig: {},
  eslint: {
    config: [
      {
        files: ['index.js'],
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
      '*.test.*',
      '/*.config.*',
      '/*.json5',
      '/*.yaml',
      '/CODEOWNERS',
      '/change/',
      '/coverage/',
      '/dagger.*',
      '/dist/',
      '/fixtures/',
    ],
  },
  prettier: {
    ignorePatterns: ['CHANGELOG.md'],
  },
  pnpmWorkspace: {
    minimumReleaseAgeExclude: [
      '@langri-sha/*',
      'screeps-modules',
      ...Project.presetPackages,
    ],
  },
  renovate: {
    extends: ['github>langri-sha/renovate-config'],
    packageRules: [
      {
        description:
          'Update screeps-modules with our own packages and install it without waiting it out',
        groupName: 'langri-sha projen toolchain',
        groupSlug: 'langri-sha-projen',
        matchPackageNames: ['screeps-modules'],
        minimumReleaseAge: null,
      },
    ],
  },
  typeScriptConfig: {
    config: {
      compilerOptions: {
        noEmit: true,
      },
      include: ['index.d.ts', 'types.test.ts'],
    },
  },
  worktrunk: {},
})

project.gitignore.addPatterns('coverage/')

project.package?.addField('types', 'index.d.ts')
project.package?.addField('packageManager', 'pnpm@12.11.2')

project.package?.setScript('start', 'pnpm run -s lint; pnpm run -s test')
project.package?.setScript('test', 'vitest run --coverage')
project.package?.setScript('lint', 'eslint .')

project.synth()
