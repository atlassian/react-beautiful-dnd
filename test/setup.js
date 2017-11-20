/* eslint-disable global-require */

// Replacing requestAnimationFrame
// Adding window check because some tests do not
// run with browser globals enabled
if (typeof window !== 'undefined') {
  require('raf-stub').replaceRaf([global, window]);
}

// setting up global enzyme
const Enzyme = require('enzyme');

const Adapter = require('enzyme-adapter-react-15');

Enzyme.configure({ adapter: new Adapter() });
