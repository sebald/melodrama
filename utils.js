const chalk = require('chalk');
const commandExists = require('command-exists');
const fs = require('fs-extra');
const ora = require('ora');
const path = require('path');

/**
 * Make sure we're not going to overwrite existing files when
 * we create the presentation boilerplate. Only white-listed files
 * are allowed to be inside directory.
 */
const allowedFiles = [
  '.DS_Store',
  'Thumbs.db',
  '.git',
  '.gitignore',
  '.idea',
  '.vscode',
  'README.md',
  'LICENSE'
];
const hasFileConflicts = dir => {
  return !fs.readdirSync(dir)
    .every(file => allowedFiles.indexOf(file) >= 0);
};

/**
 * Check wheter we can use `yarn` instead of `npm`.
 */
const isYarnAvailable = () => new Promise((resolve, reject) => {
  commandExists('yarn', (err, isAvailable) => {
    if (err) { reject(err); }
    resolve(isAvailable);
  });
});

/**
 * Show a spinner with info about installation, while a promise is pending.
 * After the promise resolves/rejects the spinner will show a success/fail message.
 */
const createInstallSpinner = promise => {
  const spinner = ora(chalk.dim('Installing dependencies. This may take a while...')).start();
  return promise
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

/**
 * Creates a minimal `package.json` inside the given `dir`.
 * This will also create the directory if it doesn't already
 * exist.
 */
const prepareDirectory = dir => new Promise((resolve, reject) => {
  const pkg = {
    name: path.basename(dir),
    version: '1.0.0',
    private: true
  };
  fs.outputJson(path.join(dir, 'package.json'), pkg, err => {
    if (err) { reject(err); }
    resolve(dir);
  });
});

/**
 * Prepate install command depending on the availble package manager.
 */
const prepareInstallCommand = verbose => {
  return isYarnAvailable().then(isAvailable => {
    let cmd, args;
    if (isAvailable) {
      cmd = 'yarn';
      args = ['add', '--dev', '--exact'];
    } else {
      cmd = 'npm';
      args = ['install', '--DE'];
      if (verbose) { args.push('--verbose'); }
    }
    return { cmd, args };
  });
};


// Public API
// ---------------
module.exports = {
  hasFileConflicts,
  isYarnAvailable,
  createInstallSpinner,
  prepareDirectory,
  prepareInstallCommand
};