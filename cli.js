#!/usr/bin/env node
'use strict';

const chalk = require('chalk');
const commandExists = require('command-exists');
const fs = require('fs-extra');
const logSymbols = require('log-symbols');
const meow = require('meow');
const ora = require('ora');
const path = require('path');
const spawn = require('cross-spawn');


// Helper
// ---------------
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


// Script ("main")
// ---------------
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
  console.log(chalk.yellow(`${logSymbols.warning} Please specify a path to create the presentation.`));
  process.exit();
}

const dir = path.resolve(cli.input[0]);
const scriptName = 'melodrama-scripts';
const verbose = cli.flags.verbose;

// Make sure we do not accidentally overwrite something.
if (fs.existsSync(dir) && hasFileConflicts(dir)) {
  console.log(chalk.red(
`${logSymbols.error} Directory ${chalk.italic(dir)} contains files that
  could conflict. Please chose another one.`
  ));
  process.exit();
}

// Prepare directory
fs.outputJsonSync(
  path.join(dir, 'package.json'),
  {
    name: path.basename(dir),
    version: '1.0.0',
    private: true
  }
);
console.log(`${logSymbols.success} Directory created at ${chalk.italic(dir)}`);

// Skip install process (for testing only)
if (cli.flags.skipInstall) {
  process.exit();
}

// Prepare install command command.
commandExists('yarn', (err, isAvailable) => {
  if (err) {
    console.log(chalk.red(err));
    process.exit(1);
  }

  // Use `yarn` if available.
  let cmd, args;
  if (isAvailable) {
    cmd = 'yarn';
    args = ['add', '--dev', '--exact'];
  } else {
    cmd = 'npm';
    args = ['install', '--DE'];
    if (verbose) { args.push('--verbose'); }
  }

  // Install `melodrama-scripts`
  process.chdir(dir);
  const spinner = ora(chalk.dim(`Installing ${chalk.italic(scriptName)}. This may take a while...`));
  spinner.start();

  const installMelodramaScripts = spawn(
    cmd,
    args.concat(scriptName),
    { stdio: verbose ? 'inherit': 'ignore' }
  );
  installMelodramaScripts.on('close', code => {
    if (code > 0) {
      spinner.text = 'Installation failed!';
      spinner.fail();
      process.exit();
    }
    spinner.text = 'Installation complete!';
    spinner.succeed();

    // Invoke bootstrap script from `melodrama-scripts`.
    const bootstrap = path.resolve(
      process.cwd(),
      'node_modules',
      scriptName,
      'index.js'
    );
    require(bootstrap)(dir, { verbose });
  });
});
