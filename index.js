const chalk = require('chalk');
const commandExists = require('command-exists');
const fs = require('fs-extra');
const logSymbols = require('log-symbols');
const ora = require('ora');
const path = require('path');
const spawn = require('execa');


/**
 * Helper to make sure we do not accidentally overwrite something.
 */
const allowedFiles = [
  '.DS_Store',
  'Thumbs.db',
  '.git',
  '.gitignore',
  '.idea',
  '.vscode',
  'LICENSE'
];
const hasFileConflicts = dir => {
  return !fs.readdirSync(dir)
    .every(file => allowedFiles.indexOf(file) >= 0);
};


/**
 * Check if we can init presentation in given `dir`, if so
 * write a small `package.json` into it.
 */
const prepareDirectory = dir => new Promise((resolve, reject) => {
  if (fs.existsSync(dir) && hasFileConflicts(dir)) {
    return reject(`${logSymbols.error} Directory ${chalk.italic(dir)} contains files that
  could conflict. Please chose another one.`
    );
  }

  const pkg = {
    name: path.basename(dir),
    version: '1.0.0',
    private: true
  };
  fs.outputJson(path.join(dir, 'package.json'), pkg, err => {
    if (err) { resolve(err); return; }
    console.log(`${logSymbols.success} Directory created at ${chalk.italic(dir)}`);
    resolve(dir);
  });
});


/**
 * Check if we can use `yarn` instead of `npm` and put together
 * installation command.
 */
const prepareInstallCommand = verbose => new Promise((resolve, reject) => {
  commandExists('yarn', (err, isAvailable) => {
    if (err) {
      return reject(chalk.red(err));
    }
    let cmd, args;
    if (isAvailable) {
      cmd = 'yarn';
      args = ['add', '--dev', '--exact'];
    } else {
      cmd = 'npm';
      args = ['install', '--DE'];
      if (verbose) { args.push('--verbose'); }
    }
    resolve({ cmd, args });
  });
});


/**
 * Invoke npm/yarn installation for (dev) dependencies.
 */
const installDependencies = (dir, cmd, args, dependencies, verbose) => {
  process.chdir(dir);

  const child = spawn(cmd, args.concat(dependencies));
  if (verbose) {
    child.stdout.pipe(process.stdout);
    return child;
  }

  // Only show loading spinner if no other stdout.
  const spinner = ora(chalk.dim(`Installing ${chalk.italic(dependencies)}. This may take a while...`));
  spinner.start();
  return child
    .then(() => {
      spinner.text = 'Installation complete!';
      spinner.succeed();
    })
    .catch(err => {
      // Forward, we only want to stop the spinner.
      spinner.text = 'Installation failed!';
      spinner.fail();
      return Promise.reject(err);
    });
};


module.exports = {
  prepareDirectory,
  prepareInstallCommand,
  installDependencies
};