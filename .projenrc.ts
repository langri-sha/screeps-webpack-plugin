import { Project, TypeScriptConfig } from '@langri-sha/projen-project'

const project = new Project({
  name: 'screeps-webpack-plugin',
  package: {
    authorEmail: 'filip.dupanovic@gmail.com',
    authorName: 'Filip Dupanović',
    authorOrganization: false,
    bugsUrl: 'https://github.com/langri-sha/screeps-webpack-plugin/issues',
    copyrightYear: '2016',
    description: 'Compile your AI against a Screeps server',
    entrypoint: 'src/index.ts',
    type: 'module',
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
    minNodeVersion: '24.22.1',
    peerDependencyOptions: {
      pinnedDevDependency: false,
    },
    repository: 'git+https://github.com/langri-sha/screeps-webpack-plugin.git',

    deps: ['debug@^4.0.0', 'screeps-modules@^2.0.0', 'tapable@^2.0.0'],
    devDeps: [
      '@langri-sha/eslint-config@0.10.0',
      '@langri-sha/lint-staged@0.9.11',
      '@langri-sha/prettier@0.4.11',
      '@langri-sha/tsconfig@1.1.1',
      '@langri-sha/vitest@0.2.3',
      '@types/debug@4.1.13',
      '@types/node@24.19.2',
      '@vitest/coverage-v8@5.0.5',
      'memfs@^4.80.0',
      'vitest@5.0.5',
      'webpack@5.112.0',
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
        '.projenrc.ts',
        'CODEOWNERS',
        'beachball.config.cjs',
        'dagger.lock',
        'dagger.toml',
        'eslint.config.js',
        'lint-staged.config.js',
        'pnpm-lock.yaml',
        'pnpm-workspace.yaml',
        'prettier.config.js',
        'renovate.json5',
        'scripts/**',
        'tsconfig.json',
      ],
    },
  },
  claude: {
    settings: {
      attribution: { commit: '', pr: '', sessionUrl: false },
    },
  },
  codeowners: {
    '*': '@langri-sha',
  },
  dagger: {
    engineVersion: 'v1.0.0-beta.19',
    workspace: {
      ignore: ['**/node_modules', '**/dist', '**/coverage', '**/*.tsbuildinfo'],
      modules: {
        ci: {
          source: 'github.com/langri-sha/dagger/ci@v1.9.0',
          generate: { skip: ['projen'] },
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
          source: 'github.com/langri-sha/dagger/vitest@v1.9.0',
        },
        typescript: {
          source: 'github.com/langri-sha/dagger/typescript@v1.9.0',
        },
        beachball: {
          source: 'github.com/langri-sha/dagger/beachball@v1.9.0',
        },
        projen: {
          source: 'github.com/langri-sha/dagger/projen@v1.9.0',
        },
      },
    },
  },
  editorConfig: {},
  eslint: {
    config: [
      {
        files: ['src/index.ts'],
        rules: { '@typescript-eslint/no-namespace': 'off' },
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
      '*.tsbuildinfo',
      '/fixtures/',
      '/scripts/',
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
      include: ['src'],
    },
  },
  worktrunk: {},
})

project.gitignore.addPatterns('coverage/')

project.package?.addField('packageManager', 'pnpm@12.15.0')

project.package?.setScript('start', 'pnpm run -s lint; pnpm run -s test')
project.package?.setScript('test', 'vitest run --coverage')
project.package?.setScript('lint', 'eslint .')

project.package?.addField('publishConfig', {
  access: 'public',
  main: 'dist/index.js',
  types: 'dist/index.d.ts',
})

project.package?.setScript('smoke', 'node scripts/smoke.js')

project.package?.setScript(
  'prepublishOnly',
  'rm -rf dist; tsc --project tsconfig.build.json',
)

new TypeScriptConfig(project, {
  fileName: 'tsconfig.build.json',
  config: {
    extends: '@langri-sha/tsconfig/build',
    compilerOptions: {
      module: 'nodenext',
      moduleResolution: 'nodenext',
    },
    include: ['src'],
    exclude: ['**/*.test.*'],
  },
})

project.synth()
