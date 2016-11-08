import test from 'ava';
import path from 'path';
import fs from 'fs-extra';
import spawn from 'execa';
import { v4 } from 'uuid';
import proxyquire from 'proxyquire';


// Helper
// ---------------
const testDir = path.resolve(process.cwd(), '.tmp');
const getRandomDir = () => path.resolve(testDir, v4());
test.before('reset all the things', () => {
  fs.removeSync(testDir);
});


// Setup
// ---------------
// Strict call throw so we can proxy the require(bootstrap)
proxyquire.noCallThru();

test.beforeEach(t => {
  t.context.dir = getRandomDir();

  t.context.yarnAvailable = true;
  t.context.lastSpawn = null;
  t.context.resolveSpawn = true;
  t.context.bootstrapArgs = null;

  const bootstrap = path.resolve(
    t.context.dir,
    'node_modules',
    'melodrama-scripts',
    'index.js'
  );

  // Stub in context so we can run tests in parallel.
  t.context.lib = proxyquire('./', {
    'command-exists': (cmd, cb) => cb(null, t.context.yarnAvailable),
    'execa': (cmd, args) => {
      t.context.lastSpawn = {cmd, args, stdout: null };
      let promise = t.context.resolveSpawn ? Promise.resolve() : Promise.reject('whoops');
      promise.stdout = { pipe: (buffer) => {t.context.lastSpawn.stdout = buffer;} };
      return promise;
    },
    'ora': () => {
      // Silence ora
      return {
        start: () => {},
        fail: () => {},
        succeed: () => {}
      };
    },
    // We are not installing this module while testing.
    [bootstrap]: function () { t.context.bootstrapArgs = arguments; }
  });
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
  await t.context.lib.prepareDirectory(t.context.dir);
  const pkg = fs.readJsonSync(`${t.context.dir}/package.json`);

  t.true(fs.existsSync(t.context.dir));
  t.is(pkg.name, path.basename(t.context.dir));
  t.is(typeof pkg.version, 'string');
  t.is(pkg.private, true);
});

test('fail if directory has conflicted files', async t => {
  fs.outputFileSync(path.join(t.context.dir, 'index.js'), 'console.log("nope");');
  t.throws(t.context.lib.prepareDirectory(t.context.dir));
});

test('some files are ok', async t => {
  fs.outputFileSync(path.join(t.context.dir, 'LICENSE'), '');
  fs.ensureDirSync(path.join(t.context.dir, '.git'));
  fs.ensureDirSync(path.join(t.context.dir, '.gitignore'));
  await t.context.lib.prepareDirectory(t.context.dir);

  t.true(fs.existsSync(t.context.dir));
  t.true(fs.existsSync(`${t.context.dir}/package.json`));
});

test('prepare install command (yarn)', async t => {
  const {cmd, args} = await t.context.lib.prepareInstallCommand();

  t.is(cmd, 'yarn');
  t.deepEqual(args, ['add', '--dev', '--exact']);
});

test('prepare install command (npm)', async t => {
  t.context.yarnAvailable = false;

  let {cmd, args} = await t.context.lib.prepareInstallCommand();
  t.is(cmd, 'npm');
  t.deepEqual(args, ['install', '--DE']);

  ({cmd, args} = await t.context.lib.prepareInstallCommand(true));
  t.is(cmd, 'npm');
  t.deepEqual(args, ['install', '--DE', '--verbose']);
});

test('install dependencies', async t => {
  await t.context.lib.installDependencies('.', 'cmd', ['arg0'], 'dep');
  t.is(t.context.lastSpawn.cmd, 'cmd');
  t.deepEqual(t.context.lastSpawn.args, ['arg0', 'dep']);
  t.is(t.context.lastSpawn.stdout, null);
});

test('install dependencies (verbose)', async t => {
  await t.context.lib.installDependencies('.', 'cmd', ['arg0'], 'dep', true);
  t.is(t.context.lastSpawn.cmd, 'cmd');
  t.deepEqual(t.context.lastSpawn.args, ['arg0', 'dep']);
  t.not(t.context.lastSpawn.stdout, null);
});

test('install dependencies (reject)', async t => {
  t.context.resolveSpawn = false;
  t.throws(t.context.lib.installDependencies('.', 'cmd', ['arg0'], 'dep'));
});

test('run all and invoke bootstrap', async t => {
  await t.context.lib.run(t.context.dir, { verbose: false });
  t.true(fs.existsSync(`${t.context.dir}/package.json`));
  t.is(typeof t.context.lastSpawn.cmd, 'string');
  t.is(t.context.bootstrapArgs[0], t.context.dir);
  t.deepEqual(t.context.bootstrapArgs[1], { verbose: false });
});