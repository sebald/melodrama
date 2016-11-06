import test from 'ava';
import path from 'path';
import fs from 'fs-extra';
import { v4 } from 'uuid';
import {
  prepareDirectory,
  prepareInstallCommand } from './utils';


const tmpDir = path.resolve(process.cwd(), '.tmp');
const getTmpDir = () => path.resolve(tmpDir, v4());

test.before('clean up temporary directory', () => {
  fs.removeSync(tmpDir);
});

test('prepare directory', async t => {
  const dir = await prepareDirectory(getTmpDir());
  const pkg = fs.readJsonSync(`${dir}/package.json`);

  t.true(fs.existsSync(dir));
  t.is(pkg.name, path.basename(dir));
  t.is(typeof pkg.version, 'string');
  t.is(pkg.private, true);
});

test('prepare install command', async t => {
  const {cmd, args} = await prepareInstallCommand();

  t.regex(cmd, /yarn|npm/);
  t.regex(args[0], /add|install/);
  t.regex(args[1], /--dev|--DE/);

  if (cmd === 'yarn') {
    t.is(args[2], '--exact');
  }
});