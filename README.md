# Melodrama

[![Build Status](https://img.shields.io/travis/sebald/melodrama/master.svg)](https://travis-ci.org/sebald/melodrama) [![Coverage Status](https://img.shields.io/coveralls/sebald/melodrama/master.svg)](https://coveralls.io/github/sebald/melodrama?branch=master) [![npm](https://img.shields.io/npm/v/melodrama.svg)](https://www.npmjs.com/package/melodrama)

Create boilerplates for presentation in a jiffy, with almost no configuration. Think of [`create-react-app`](https://github.com/facebookincubator/create-react-app) for presentations!

### Why?

[FormidableLabs](https://github.com/FormidableLabs) created an awesome library called [Spectacle](https://github.com/FormidableLabs/spectacle) to create presentations with React. But as with any React app there is some overhead with configuration of a transpiler etc.

There is a [Spectacle Boilerplate](https://github.com/FormidableLabs/spectacle-boilerplate/) but you have to clone the repo, remove the `.git` folder and so on. Lots of drama as you can!

Melodrama is for the lazy ones that just want to create a presentation for their next meetup or conference talk. Below you'll find some benefits of using Melodrama.

### Features

- Bootstrap project directory (`package.json`, `README`, ...)
- Install required dependencies
- Install scripts that run a dev server for you
- Optionally install a Spectacle theme
- Optionally install syntax highlighting
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

While bootstrapping Melodrama will ask you:

- If you want to use a theme (fetched from the npm registry)
- If you want to use syntax highlighting

Depending on you answers [PrismJS](http://prismjs.com/) and/or the chosen theme will be installed besided other required dependencies.

Once the installation is done, you can run the following scripts:

#### `npm start`

Compile the presentation and start a develeopment server in watch mode. Your (default) browser should open automatically after the first compilation was successful.

Open `index.js` to develop you presentation! Saving will automatically refresh your browser.

## What compiles?

Under the hood runs a [`webpack-deve-server`](https://github.com/webpack/webpack-dev-server) that will load:

- **JS(X)** with [Babel](http://babeljs.io/) using `react`, `es2015` and `stage-0`preset.
- **Markdown** with `html-loader` and `markdown-loader`
- **CSS** with `css-loader` and `style-loader`
- **JSON** with `json-loader`
- **Images/Fonts** with `file-loader`

### Where is my `index.html`?

Melodrama will take care that your presentation is correctly rendered. No need to do anything here!

## Develop

- Test: `npm test` (optional: `-- --watch`)
- Coverage: `npm run report`
- Example run: `npm run dev:init`