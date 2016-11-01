#!/usr/bin/env node
'use strict';

const path = require('path');
const chalk = require('chalk');
const commandExists = require('command-exists');
const fs = require('fs-extra');
const meow = require('meow');
const spawn = require('execa');


// Helper to make sure we're not overwriting things
const allowedFiles = ['.DS_Store', 'Thumbs.db', '.git', '.gitignore', '.vscode', 'README.md', 'LICENSE'];
const noFileConflict = dir => {
  return fs.readdirSync(dir)
    .every(file => allowedFiles.indexOf(file) >= 0);
};

// Helper to check if we can use yarn.
const isYarnAvailable = () => new Promise((resolve, reject) => {
  commandExists('yarn', (err, isAvailable) => {
    if (err) { reject(err); }
    resolve(isAvailable);
  });
});


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
if (!fs.existsSync(rootDir)) {
  fs.ensureDirSync(rootDir);
} else if (!noFileConflict(rootDir)) {
  console.log(chalk.red(`Directory ${rootDir} contains files that could conflict.`));
  process.exit(1);
}

// Finally, all input validated. Let's bootstrap!
console.log(chalk.cyan(`Creating new Spectacle presentation in ${rootDir}.`));

// Create a very basic `package.json`
const pkg = {
  name: rootDir.match(/([^\/]*)\/*$/)[1],
  version: '1.0.0'
};
fs.writeFileSync(
  path.join(rootDir, 'package.json'),
  JSON.stringify(pkg, null, 2)
);

// Do NOT install dependencies (for testing only!)
if (cli.flags.skipInstall) {
  console.log(chalk.yellow('Skipping installation of dependencies.'));
  process.exit();
}

// Install dependencies
isYarnAvailable()
  .then(isAvailable => {
    let cmd, args;
    if (isAvailable) {
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

    // Go and install everything.
    console.log(chalk.cyan('Installing dependencies. This may take a while...'));
    console.log();
    process.chdir(rootDir);

    const child = spawn(cmd, args);
    if(cli.flags.verbose) {
      child.stdout.pipe(process.stdout);
    }
    return child;
  })
  .then(() => {
    console.log('<insert init script here>');
  })
  .catch(err => {
    console.log(chalk.red('Installation failed because of the following reaons:'));
    console.log(chalk.red(err));
    process.exit(1);
  });