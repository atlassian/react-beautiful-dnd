/* eslint-disable global-require */
/* eslint-disable flowtype/require-valid-file-annotation */

// Replacing requestAnimationFrame
// Adding window check because some tests do not
// run with browser globals enabled
if (typeof window !== 'undefined') {
  require('raf-stub').replaceRaf([global, window]);

  // overriding these properties in jsdom to allow them to be controlled

  Object.defineProperties(document.documentElement, {
    clientWidth: { writable: true, value: document.documentElement.clientWidth },
    clientHeight: { writable: true, value: document.documentElement.clientHeight },
    scrollWidth: { writable: true, value: document.documentElement.scrollWidth },
    scrollHeight: { writable: true, value: document.documentElement.scrollHeight },
  });
}

// setting up global enzyme
const Enzyme = require('enzyme');

const Adapter = require('enzyme-adapter-react-15');

Enzyme.configure({ adapter: new Adapter() });

