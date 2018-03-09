import { configure } from '@storybook/react';
// adding css reset - storybook includes a css loader
import '@atlaskit/css-reset';

// dynamically load in all the stories in the /stories directory
// https://github.com/storybooks/storybook/issues/125#issuecomment-212404756
const req = require.context('../stories/', true, /story\.js$/)

function loadStories() {
  req.keys().forEach(req)
}

configure(loadStories, module);

// console.log('Adding some window event handlers to the story');

// [
//   'click',
//   'mousedown',
//   'mousemove',
//   'mouseup',
//   'keydown',
//   'keyup',
//   'touchstart',
//   'touchend',
//   'touchmove',
// ].forEach((name: String) => {
//   window.addEventListener(name, (event: Event) => console.warn(`
//     window event received
//     event: ${name}.
//     defaultPrevented: ${event.defaultPrevented}
//   `));
// });