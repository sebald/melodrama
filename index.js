#!/usr/bin/env node
'use strict';

const path = require('path');
const chalk = require('chalk');
const commandExists = require('command-exists');
const fs = require('fs-extra');
const meow = require('meow');
const spawn = require('cross-spawn');

const cli = meow(`
  ${chalk.underline('Usage:')}
    $ create-spectacle <dir> [options]

  ${chalk.underline('Options:')}
    --syntax          install with syntax highlighting
    -h, --help        output usage information
    -v, --version     output the version number
    --verbose         print logs while executing command
`, {
  alias: {
    v: 'version'
  },
  boolean: ['help', 'syntax', 'verbose', 'version']
});

// Make sure user gave us an diretory
if (!cli.input.length) {
  cli.showHelp();
  process.exit();
}

// Make sure we're not overwriting anything
const rootDir = path.resolve(cli.input.shift());
if (fs.existsSync(rootDir)) {
  console.log(chalk.red(`Directory ${rootDir} already exists!`));
  console.log(chalk.red('Please choose another directory.'));
  process.exit(1);
}

// Finally, all input validated. Let's bootstrap!
console.log(chalk.cyan(`Creating new Spectacle presentation in ${rootDir}.`));
fs.ensureDirSync(rootDir);

// Create a very basic `package.json`
const pkg = {
  name: rootDir.match(/([^\/]*)\/*$/)[1],
  version: '1.0.0'
};
fs.writeFileSync(
  path.join(rootDir, 'package.json'),
  JSON.stringify(pkg, null, 2)
);

// Can we use `yarn`?
commandExists('yarn', (err, cmdExists) => {
  let cmd, args;
  if (cmdExists) {
    cmd = 'yarn';
    args = ['add', '--exact'];
  } else {
    cmd = 'npm';
    args = ['install', '--SE'];
  }
  if (cli.flags.verbose) { args.push('--verbose'); }

  // Add dependencies
  args.push(
    'react',
    'react-dom',
    'spectacle'
  );
  if(cli.flags.syntax) {
    args.push('prismjs');
  }

  // Skip install (for testing)
  if (cli.flags.skipInstall) {
    process.exit();
  }

  // Go and install everything.
  console.log(chalk.cyan('Installing dependencies. This may take a while...'));
  console.log();
  process.chdir(rootDir);
  let proc = spawn(cmd, args, {stdio: 'inherit'});
  proc.on('close', code => {
    if (code !== 0) {
      console.log(chalk.red(`Execution of command ${cmd} ${args.join(' ')} failed!`));
      return;
    }
    console.log('<insert init script here>');
  });
});