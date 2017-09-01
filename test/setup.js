/* eslint-disable global-require */

// Replacing requestAnimationFrame
// Adding window check because some tests do not
// run with browser globals enabled
if (typeof window !== 'undefined') {
  require('raf-stub').replaceRaf([global, window]);
}
