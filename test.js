import test from 'ava';
import spawn from 'execa';
import path from 'path';
import fs from 'fs-extra';
import { v4 } from 'uuid';

const tmpDir = path.resolve(process.cwd(), '.tmp');
const getTmpDir = () => path.resolve(tmpDir, v4());

const index = require.resolve('./index');
async function melodrama (...args) {
  args.unshift(index);
  args.push('--skip-install');
  return spawn('node', args);
}

test.before('clean up temporary directory', t => {
  fs.removeSync(tmpDir);
});

test('show help if no <dir>', async t => {
  const result = await melodrama();
  t.is(typeof result.stdout, 'string');
});

test('can be added to existing direcotry', async t => {
  const dir = getTmpDir();
  fs.mkdirsSync(dir);
  const result = await melodrama(dir);
  t.is(result.code, 0);
});

test('does abort if there folder has some non-allowed files', async t => {
  t.throws(melodrama('.'));
});

test('create package.json in <dir>', async t => {
  const dir = getTmpDir();
  const result = await melodrama(dir);
  const pkg = fs.readJsonSync(`${dir}/package.json`);

  t.is(result.code, 0);
  t.is(typeof pkg.name, 'string');
  t.is(pkg.version, '1.0.0');
});