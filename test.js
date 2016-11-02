import test from 'ava';
import path from 'path';
import fs from 'fs-extra';
import { v4 } from 'uuid';
import {
  run,
  prepareDirectory,
  prepareInstallCommand,
  prepareDependencies } from './init';


const tmpDir = path.resolve(process.cwd(), '.tmp');
const getTmpDir = () => path.resolve(tmpDir, v4());

test.before('clean up temporary directory', () => {
  fs.removeSync(tmpDir);
});

// Just a smoke test...
test('expose a `run` command', async t => {
  t.is(typeof run, 'function');
});

test('prepare directory', async t => {
  const dir = await prepareDirectory(getTmpDir());
  const pkg = fs.readJsonSync(`${dir}/package.json`);

  t.true(fs.existsSync(dir));
  t.is(pkg.name, path.basename(dir));
  t.is(typeof pkg.version, 'string');
});

test('prepare install command', async t => {
  const {cmd, args} = await prepareInstallCommand();

  t.regex(cmd, /yarn|npm/);
  t.regex(args[0], /add|install/);
  t.regex(args[1], /--exact|--SE/);
});

test('prepare dependencies (no syntax)', t => {
  let dependencies = prepareDependencies({ syntax: false });

  t.true(dependencies.indexOf('react') >= 0);
  t.true(dependencies.indexOf('react-dom') >= 0);
  t.true(dependencies.indexOf('spectacle') >= 0);
  t.false(dependencies.indexOf('prismjs') >= 0);
});

test('prepare dependencies (with syntax)', t => {
  let dependencies = prepareDependencies({ syntax: true });

  t.true(dependencies.indexOf('react') >= 0);
  t.true(dependencies.indexOf('react-dom') >= 0);
  t.true(dependencies.indexOf('spectacle') >= 0);
  t.true(dependencies.indexOf('prismjs') >= 0);
});

test('prepare dependencies (with theme)', t => {
  let dependencies = prepareDependencies({ syntax: true, theme: 'foo' });

  t.true(dependencies.indexOf('react') >= 0);
  t.true(dependencies.indexOf('react-dom') >= 0);
  t.true(dependencies.indexOf('spectacle') >= 0);
  t.true(dependencies.indexOf('prismjs') >= 0);
  t.true(dependencies.indexOf('spectacle-theme-foo') >= 0);
});