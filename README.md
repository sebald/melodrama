# Melodrama

[![Build Status](https://img.shields.io/travis/sebald/melodrama/master.svg)](https://travis-ci.org/sebald/melodrama) [![Coverage Status](https://img.shields.io/coveralls/sebald/melodrama/master.svg)](https://coveralls.io/github/sebald/melodrama?branch=master) [![npm](https://img.shields.io/npm/v/melodrama.svg)](https://www.npmjs.com/package/melodrama)

Create boilerplates for presentation in a jiffy, with almost no configuration. Think of [`create-react-app`](https://github.com/facebookincubator/create-react-app) for presentations!

### Why?

[FormidableLabs](https://github.com/FormidableLabs) created an awesome library called [Spectacle](https://github.com/FormidableLabs/spectacle) to create presentations with React. But as with any React app there is some overhead with configuration of a transpiler etc.

There is a [Spectacle Boilerplate](https://github.com/FormidableLabs/spectacle-boilerplate/) but you have to clone the repo, remove the `.git` folder and so on. Lots of drama as you see!

Melodrama is for the lazy ones that just want to create a presentation for their next meetup or conference talk. Below you'll find some benefits of using Melodrama.

### Features

- Bootstrap project directory (`package.json`, `README`, ...)
- Install required dependencies
- Install scripts that run a dev server for you
- Optionally install a Spectacle theme
- Optionally install syntax highlighting
- Uses `yarn` in favor of `npm` if installed
- Loading spinners while everything is downloaded from the npm registry!

## Getting Started

### Install

Install Melodrama **globally**:

```
npm install -g melodrama
```

### Create a presentation

To create a new presentation, run:

```
melodrama my-spectacle-presentation
````

This will created a directory called `my-spectacle-presentation` inside the current directory. The bootstrapping process will generate the following folder structure:

```
my-spectacle-presentation/
  node_modules/
  .gitignore
  index.js
  package.json
  README.md
```

While bootstrapping, Melodrama will ask you:

- If you want to use a theme (fetched from the npm registry)
- If you want to use syntax highlighting

Depending on you answers [PrismJS](http://prismjs.com/) and/or the chosen theme will be installed besided other required dependencies.

Once the installation is done, you can run the following scripts:

### `npm start`

Compile the presentation and start a develeopment server in watch mode. Your (default) browser should open automatically after the first compilation was successful.

Open `index.js` to develop you presentation!

### `npm run build`

When you're done with your presentation run the build command and Melodrama will output a minified, bundled presentation for you.

## What compiles?

Under the hood runs a [`webpack-dev-server`](https://github.com/webpack/webpack-dev-server) that will load:

- **JS(X)** with [Babel](http://babeljs.io/) using `react`, `es2015` and `stage-0`preset.
- **Markdown** with `html-loader` and `markdown-loader`
- **CSS** with `css-loader` and `style-loader`
- **JSON** with `json-loader`
- **Images/Fonts** with `file-loader`

This means that any resource you `import`/`require` will automatically be included into your presentation.

## Loading code examples from a file

Spectacle allows you to easily display code via the `<CodePane>` component. If you want to load your example code directly from a file you can do this by telling webpack to load it with the `raw-loader`. For example:

```jsx
<CodePane
  lang="js"
  source={require('raw!./example.js')}
></CodePane>
```

### Where is my `index.html`?

Melodrama will take care that your presentation is correctly rendered. You shouldn't have to edit anything here.

## :information_source: Reporting issues

*tl;dr; Please report any issue occuring while developing [here](https://github.com/sebald/melodrama-scripts/issues)!*

Melodrama is split into two seperate repositories/packages. This one and [a repo containing all scripts](https://github.com/sebald/melodrama-scripts). The benefit of having all the "development scripts" inside another `npm` package is that you do not have to update Melodrama. Instead, everytime you're bootstrapping a new presentation, the latest `melodrama-scripts` will be downloaded for you.

Because of this, please report any issue that occuris during development [here](https://github.com/sebald/melodrama-scripts/issues)!

## Develop

- Test: `npm test` (optional: `-- --watch`)
- Coverage: `npm run report`
- Example run: `npm run dev:init`
