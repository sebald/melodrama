const path = require('path');
const chalk = require('chalk');
const emoji = require('node-emoji').get;
const got = require('got');
const commandExists = require('command-exists');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const spawn = require('execa');


// Helpers
// ---------------
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
const noFileConflict = dir => {
  return fs.readdirSync(dir)
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
 * Query alternative npm registry for spectacle themes.
 */
const defaultTheme = 'default';
const themePrefix = 'spectacle-theme-';
const findSpectacleThemes = () => {
  return got(`https://api.npms.io/v2/search?q=${themePrefix}`, {json: true})
    .then(({body}) => {
      const themes = body.results
        .map(result => result.package)
        .map(({ name }) => name.replace(themePrefix, ''));
      themes.unshift(defaultTheme);
      return themes;
    });
};


// Preparation
// ---------------
/**
 * Creates a minimal `package.json` inside the given `dir`.
 * This will also create the directory if it doesn't already
 * exist.
 */
const prepareDirectory = dir => new Promise((resolve, reject) => {
  const pkg = {
    name: path.basename(dir),
    version: '1.0.0'
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
      args = ['add', '--exact'];
    } else {
      cmd = 'npm';
      args = ['install', '--SE'];
      if (verbose) { args.push('--verbose'); }
    }
    return { cmd, args };
  });
};

/**
 * Prepare a list of required and optional dependencies.
 */
const prepareDependencies = ({ syntax, theme }) => {
  const dependencies = ['react', 'react-dom', 'spectacle'];
  if (syntax) { dependencies.push('prismjs'); }
  if (theme && theme !== defaultTheme) { dependencies.push(`${themePrefix}${theme}`); }
  return dependencies;
};


// Run
// ---------------
/**
 * Prompt the user with some questions about the presentation
 * and create the boilerplate accordingly.
 */
const run = ({ verbose }) => {
  return inquirer
    .prompt([{
      type: 'input',
      name: 'dir',
      message: 'Where should the presentation be created?',
      default: 'my-presentation',
      validate(dir) {
        // Check that the chosen directory doesn't have conflicts.
        // E.g. we would overwrite some files when creating the presentation
        // in that directory.
        if (!fs.existsSync(dir) || noFileConflict(dir)) { return true; }
        return chalk.red(`Directory ${chalk.italic(dir)} contains files that could conflict. Please choose another one.`);
      },
      filter(dir) {
        return path.resolve(process.cwd(), dir);
      }
    }])
    .then(({ dir }) => {
      const questions = [{
        type: 'confirm',
        name: 'syntax',
        message: 'Do you want syntax highlighting?',
        default: true
      }];
      const config = () => findSpectacleThemes()
        .then(themes => {
          // Only default theme available, no need to ask.
          if (themes.length < 2) { return questions; }
          // Don't want to mutate `questions` array...
          return [{
            type: 'list',
            name: 'theme',
            message: 'Choose a theme:',
            choices: themes
          }].concat(questions.slice());
        })
        // Safety net, if we can not query npm registry.
        .catch(() => {
          console.log();
          console.log(chalk.red(`${emoji('crying_cat_face')}  There was a problem fetching theme suggestions. Using default theme.`));
          return questions;
        })
        .then(qs => inquirer.prompt(qs));
      return Promise.all([dir, config()]);
    })
    .then(([ dir, config ]) => Promise.all([
      prepareDirectory(dir),
      prepareInstallCommand(verbose),
      prepareDependencies(config)
    ]))
    //Go and install everything.
    .then(([dir, {cmd, args}, dependencies]) => {
      console.log();
      console.log(chalk.cyan(`${emoji('coffee')}  Installing dependencies. This may take a while...`));
      process.chdir(dir);
      const child = spawn(cmd, args.concat(dependencies));
      if(verbose) {
        child.stdout.pipe(process.stdout);
      }
      return child;
    })
    // Initialize `melodrama-scripts` (TODO)
    .then(() => {
      console.log('<insert init script here>');
    });
};


// Exports
// ---------------
module.exports = {
  run,
  prepareDirectory,
  prepareInstallCommand,
  prepareDependencies
};