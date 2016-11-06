#!/usr/bin/env node
'use strict';

const chalk = require('chalk');
const emoji = require('node-emoji').get;
const fs = require('fs-extra');
const meow = require('meow');
const path = require('path');
const PrettyError = require('pretty-error');
const execa = require('execa');
const spawn = require('cross-spawn');

const {
  createInstallSpinner,
  hasFileConflicts,
  prepareDirectory,
  prepareInstallCommand } = require('./utils');

// CLI
const cli = meow({
  description: false,
  help:
`
  ${chalk.underline('Usage:')}
    $ melodrama <dir>

  ${chalk.underline('Options:')}
    -h, --help        output usage information
    -v, --version     output the version number
    --verbose         print logs while executing command
`
}, {
  alias: {
    v: 'version'
  },
  boolean: ['help', 'verbose', 'version']
});

// Require a file path.
if (!cli.input[0]) {
  console.log(chalk.red(`${emoji('no_entry')} Please specify a path to setup the presentation.`));
  process.exit();
}

const dir = path.resolve(cli.input[0]);
const verbose = cli.flags.verbose;

// Make sure we do not accidentally overwrite something.
if (fs.existsSync(dir) && hasFileConflicts(dir)) {
  console.log(chalk.red(`${emoji('open_file_folder')} Directory ${chalk.italic(dir)} contains files that could conflict.`));
  console.log(chalk.red('Please choose another one.'));
  process.exit();
}

// "Main"
prepareDirectory(dir)
  .then(() => prepareInstallCommand(verbose))
  .then(({ cmd, args }) => {
    process.chdir(dir);
    console.log(
      chalk.green(`${emoji('file_folder')} Folder created at `) +
      chalk.green.italic(dir)
    );
    // Use `execa`, b/c it lets us handle errors more gracefully.
    const child = execa(cmd, args.concat('melodrama-scripts'));
    // Only show a spinner if stdout isn't verbose.
    if (verbose) {
      child.stdout.pipe(process.stdout);
      return child;
    }
    return createInstallSpinner(child);
  })
  .then(() => new Promise((resolve, reject) =>{
    const initScript = path.resolve(
      process.cwd(),
      'node_modules',
      'melodrama-scripts',
      'scripts',
      'init.js'
    );
    const child = spawn(
      'node',
      [
        initScript,
        cli.flags.verbose ? '--verbose' : ''
      ],
      { stdio: 'inherit' });
    child.on('close', code => {
      if (code > 0) { return reject(code); }
      resolve();
    });
  }))
  .catch(err => {
    const pe = new PrettyError();
    console.log();
    console.log(chalk.red(`${emoji('rotating_light')} Bootstrapping failed because of the following reasons:`));
    console.log(pe.render(err));
    process.exit();
  });