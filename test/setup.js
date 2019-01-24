/* eslint-disable global-require */
/* eslint-disable flowtype/require-valid-file-annotation */

// Replacing requestAnimationFrame
// Adding window check because some tests do not
// run with browser globals enabled
if (typeof window !== 'undefined') {
  require('raf-stub').replaceRaf([global, window]);

  // overriding these properties in jsdom to allow them to be controlled

  Object.defineProperties(document.body, {
    clientWidth: {
      writable: true,
      value: document.body.clientWidth,
    },
    clientHeight: {
      writable: true,
      value: document.body.clientHeight,
    },
    scrollWidth: {
      writable: true,
      value: document.body.scrollWidth,
    },
    scrollHeight: {
      writable: true,
      value: document.body.scrollHeight,
    },
  });
}

// Setting initial viewport
// Need to set clientWidth and clientHeight as jsdom does not set these properties
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  document.body.clientWidth = window.innerWidth;
  document.body.clientHeight = window.innerHeight;
}
// setting up global enzyme
const Enzyme = require('enzyme');

const Adapter = require('enzyme-adapter-react-16');

Enzyme.configure({ adapter: new Adapter() });
