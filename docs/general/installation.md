# Installation

[![module formats: umd, cjs, and esm](https://img.shields.io/badge/module%20formats-umd%2c%20cjs%2c%20esm-green.svg?style=flat)](https://unpkg.com/react-beautiful-dnd/dist/)

## General

1. Add the `react-beautiful-dnd` package

```bash
# yarn
yarn add react-beautiful-dnd

# npm
npm install react-beautiful-dnd --save
```

2. Use the package

```js
import { DragDropContext } from 'react-beautiful-dnd';
```

3. Profit 🕺

## `React` environment

In order to use `react-beautiful-dnd` you will probably want to have a `React` environment set up.

- [Add react to a website](https://reactjs.org/docs/add-react-to-a-website.html) - official `React` docs
- [Setup a react environment with `create-react-app`](https://egghead.io/lessons/react-set-up-a-react-environment-with-create-react-app) - from our [free getting started course](https://egghead.io/courses/beautiful-and-accessible-drag-and-drop-with-react-beautiful-dnd)

## Distribution bundle

A [universal module definition](https://github.com/umdjs/umd) bundle is published on `npm` under the `/dist` folder for consumption . We publish the following files:

- `dist/react-beautiful-dnd.js`
- `dist/react-beautiful-dnd.min.js` (minified bundle)

These bundles list `react` as an external which needs to be provided. This is done to reduce the size of the bundle and prevent consumers from loading `react` multiple times. You can provide `react` through your module system or simply by having `react` on the `window`.

You can use the UMD to run `react-beautiful-dnd` directly in the browser.

```html
<!-- peer dependency -->
<script src="https://unpkg.com/react@16.3.1/umd/react.development.js"></script>
<!-- lib (change x.x.x for the version you would like) -->
<script src="https://unpkg.com/react-beautiful-dnd@x.x.x/dist/react-beautiful-dnd.js"></script>
<!-- needed to mount your react app -->
<script src="https://unpkg.com/react-dom@16.3.1/umd/react-dom.development.js"></script>

<script>
  const React = window.React;
  const ReactDOM = window.ReactDOM;
  const { DragDropContext, Draggable, Droppable } = window.ReactBeautifulDnd;

  class App extends React.Component {
    //...
  }

  // You can use JSX if your environment supports it
  ReactDOM.render(React.createElement(App), document.getElementById('app'));
</script>
```

There is also an [example codepen](https://codepen.io/alexreardon/project/editor/ZyNMPo) you can use to play with this installation method.

## [`ClojureScript`](https://clojurescript.org/)

You can consume `react-beautiful-dnd` from within `ClojureScript` using [CLJSJS](https://cljsjs.github.io/)!

[Back to home](/README.md#documentation-)
