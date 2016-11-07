import test from 'ava';
import path from 'path';
import fs from 'fs-extra';
import spawn from 'execa';
import { v4 } from 'uuid';

const tmpDir = path.resolve(process.cwd(), '.tmp');
const getTmpDir = () => path.resolve(tmpDir, v4());

test.before('clean up temporary directory', () => {
  fs.removeSync(tmpDir);
});

test('require input path', async t => {
  const r = await spawn('node', ['cli.js', '--skip-install']);
  t.is(r.code, 0);
});

test('prepare directory', async t => {
  const dir = getTmpDir();
  await spawn('node', ['cli.js', dir, '--skip-install']);
  const pkg = fs.readJsonSync(`${dir}/package.json`);

  t.true(fs.existsSync(dir));
  t.is(pkg.name, path.basename(dir));
  t.is(typeof pkg.version, 'string');
  t.is(pkg.private, true);
});

test('fail if directory has conflicted files', async t => {
  const dir = getTmpDir();
  fs.outputFileSync(path.join(dir, 'index.js'), 'console.log("nope");');
  const r = await spawn('node', ['cli.js', dir, '--skip-install']);

  t.false(fs.existsSync(`${dir}/package.json`));
  t.is(r.code, 0);
  t.regex(r.stdout, /conflict/);
  t.regex(r.stdout, new RegExp(dir));
});

test('some files are ok', async t => {
  const dir = getTmpDir();
  fs.outputFileSync(path.join(dir, 'LICENSE'), '');
  fs.ensureDirSync(path.join(dir, '.git'));
  fs.ensureDirSync(path.join(dir, '.gitignore'));
  await spawn('node', ['cli.js', dir, '--skip-install']);

  t.true(fs.existsSync(dir));
  t.true(fs.existsSync(`${dir}/package.json`));
});