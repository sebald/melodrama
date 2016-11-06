#!/usr/bin/env node
'use strict';

const chalk = require('chalk');
const commandExists = require('command-exists');
const emoji = require('node-emoji').get;
const fs = require('fs-extra');
const meow = require('meow');
const path = require('path');
const spawn = require('cross-spawn');

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

// Prepare directory
fs.outputJsonSync(
  path.join(dir, 'package.json'),
  {
    name: path.basename(dir),
    version: '1.0.0',
    private: true
  }
);
console.log(
  chalk.green(`${emoji('file_folder')} Folder created at `) +
  chalk.green.italic(dir)
);


// Prepare install command command
commandExists('yarn', (err, isAvailable) => {
  if (err) {
    console.log(chalk.red(err));
    process.exit(1);
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

  process.chdir(dir);
  console.log(chalk.dim('Installing...'));
  const installMelodramaScripts = spawn(
    cmd,
    args.concat('melodrama-scripts'),
    { stdio: verbose ? 'inherit': 'ignore' }
  );
  installMelodramaScripts.on('close', code => {
    if (code > 0) {
      console.log(chalk.red('Installation failed.'));
      process.exit();
    }

    const bootstrap = path.resolve(
      process.cwd(),
      'node_modules',
      'melodrama-scripts',
      'index.js'
    );
    require(bootstrap)(dir, { verbose });

    // const initScript = path.resolve(
    //   process.cwd(),
    //   'node_modules',
    //   'melodrama-scripts',
    //   'scripts',
    //   'init.js'
    // );
    // spawn(
    //   'node',
    //   [
    //     initScript,
    //     cli.flags.verbose ? '--verbose' : ''
    //   ],
    //   { stdio: 'inherit' }
    // );
  });
});
