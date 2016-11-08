#!/usr/bin/env node
'use strict';

const chalk = require('chalk');
const logSymbols = require('log-symbols');
const meow = require('meow');
const path = require('path');
const PrettyError = require('pretty-error');
const init = require('./').run;


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
  console.log(chalk.yellow(`${logSymbols.warning} Please specify a path to create the presentation.`));
  process.exit();
}

// Install package and invoke bootstrapping.
const dir = path.resolve(cli.input[0]);
const verbose = cli.flags.verbose;
init(dir, { verbose })
  .catch(err => {
    const pe = new PrettyError();
    console.log();
    console.log(`${logSymbols.error} Bootstrapping failed because of the following reasons:`);
    console.log(pe.render(err));
    process.exit();
  });