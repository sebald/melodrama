#!/usr/bin/env node
'use strict';

const chalk = require('chalk');
const emoji = require('node-emoji').get;
const meow = require('meow');
const init = require('./init');


const cli = meow(`
  ${chalk.underline('Usage:')}
    $ melodrama

  ${chalk.underline('Options:')}
    -h, --help        output usage information
    -v, --version     output the version number
    --verbose         print logs while executing command
`, {
  alias: {
    v: 'version'
  },
  boolean: ['help', 'verbose', 'version']
});

console.log();
init.run({ verbose: cli.flags.verbose })
  .then(() => process.exit())
  .catch(err => {
    console.log();
    console.log(chalk.red(`${emoji('skull_and_crossbones')}  Installation failed because of the following reasons:`));
    console.log(chalk.red(err));
    process.exit(1);
  });