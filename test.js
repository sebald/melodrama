import test from 'ava';
import path from 'path';
import fs from 'fs-extra';
import spawn from 'execa';
import { v4 } from 'uuid';
import proxyquire from 'proxyquire';


// Stub
// ---------------
let yarnAvailable;
let lastSpawn;
let resolveSpawn;

const lib = proxyquire('./', {
  'command-exists': (cmd, cb) => cb(null, yarnAvailable),
  'execa': (cmd, args) => {
    lastSpawn = {cmd, args, stdout: null };
    let promise = resolveSpawn ? Promise.resolve() : Promise.reject('whoops');
    promise.stdout = { pipe: (buffer) => {lastSpawn.stdout = buffer;} };
    return promise;
  },
  'ora': () => {
    // Silence ora
    return {
      start: () => {},
      fail: () => {},
      succeed: () => {}
    };
  }
});


// Helper
// ---------------
const tmpDir = path.resolve(process.cwd(), '.tmp');
const getTmpDir = () => path.resolve(tmpDir, v4());
test.before('reset all the things', () => {
  yarnAvailable = true;
  lastSpawn = null;
  resolveSpawn = true;
  fs.removeSync(tmpDir);
});


// CLI
// ---------------
test('require input path', async t => {
  const r = await spawn('node', ['cli.js', '--skip-install']);
  t.is(r.code, 0);
});


// Lib
// ---------------
test('prepare directory', async t => {
  const dir = getTmpDir();
  await lib.prepareDirectory(dir);
  const pkg = fs.readJsonSync(`${dir}/package.json`);

  t.true(fs.existsSync(dir));
  t.is(pkg.name, path.basename(dir));
  t.is(typeof pkg.version, 'string');
  t.is(pkg.private, true);
});

test('fail if directory has conflicted files', async t => {
  const dir = getTmpDir();
  fs.outputFileSync(path.join(dir, 'index.js'), 'console.log("nope");');
  t.throws(lib.prepareDirectory(dir));
});

test('some files are ok', async t => {
  const dir = getTmpDir();
  fs.outputFileSync(path.join(dir, 'LICENSE'), '');
  fs.ensureDirSync(path.join(dir, '.git'));
  fs.ensureDirSync(path.join(dir, '.gitignore'));
  await lib.prepareDirectory(dir);

  t.true(fs.existsSync(dir));
  t.true(fs.existsSync(`${dir}/package.json`));
});

test('prepare install command (yarn)', async t => {
  const {cmd, args} = await lib.prepareInstallCommand();

  t.is(cmd, 'yarn');
  t.deepEqual(args, ['add', '--dev', '--exact']);
});

test('prepare install command (npm)', async t => {
  yarnAvailable = false;

  let {cmd, args} = await lib.prepareInstallCommand();
  t.is(cmd, 'npm');
  t.deepEqual(args, ['install', '--DE']);

  ({cmd, args} = await lib.prepareInstallCommand(true));
  t.is(cmd, 'npm');
  t.deepEqual(args, ['install', '--DE', '--verbose']);
});

test.serial('install dependencies', async t => {
  await lib.installDependencies('.', 'cmd', ['arg0'], 'dep');
  t.is(lastSpawn.cmd, 'cmd');
  t.deepEqual(lastSpawn.args, ['arg0', 'dep']);
  t.is(lastSpawn.stdout, null);
});

test.serial('install dependencies (verbose)', async t => {
  await lib.installDependencies('.', 'cmd', ['arg0'], 'dep', true);
  t.is(lastSpawn.cmd, 'cmd');
  t.deepEqual(lastSpawn.args, ['arg0', 'dep']);
  t.not(lastSpawn.stdout, null);
});

test.serial('install dependencies (reject)', async t => {
  resolveSpawn = false;
  t.throws(lib.installDependencies('.', 'cmd', ['arg0'], 'dep'));
});