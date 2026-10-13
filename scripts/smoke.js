import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const run = (command, args, cwd) =>
  execFileSync(command, args, { cwd, encoding: 'utf8', stdio: 'pipe' })

const workdir = mkdtempSync(join(tmpdir(), 'screeps-webpack-plugin-smoke-'))

try {
  run('pnpm', ['run', 'prepublishOnly'])
  run('pnpm', ['pack', '--pack-destination', workdir])

  const [tarball] = readdirSync(workdir).filter((name) => name.endsWith('.tgz'))
  const project = join(workdir, 'project')

  run('mkdir', [project])
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'smoke', private: true, type: 'module' }),
  )
  run(
    'npm',
    ['install', '--no-audit', '--no-fund', join(workdir, tarball)],
    project,
  )

  const check = `
    if (typeof Plugin !== 'function') throw new Error('not a class')
    if (typeof new Plugin().apply !== 'function') {
      throw new Error('not a webpack plugin')
    }

    const hooks = Plugin.getHooks({})

    for (const name of ['collectModules', 'configureClient', 'beforeCommit', 'afterCommit']) {
      if (typeof hooks[name].tap !== 'function') {
        throw new Error('missing hook ' + name)
      }
    }

    if (typeof hooks.collectModules.tapAsync !== 'function') {
      throw new Error('collectModules is not asynchronous')
    }
  `

  run(
    'node',
    [
      '--input-type=module',
      '-e',
      `import Plugin from 'screeps-webpack-plugin'; ${check}`,
    ],
    project,
  )
  run(
    'node',
    ['-e', `const Plugin = require('screeps-webpack-plugin'); ${check}`],
    project,
  )

  console.log('The packed tarball loads through import and require().')
} finally {
  rmSync(workdir, { force: true, recursive: true })
}
