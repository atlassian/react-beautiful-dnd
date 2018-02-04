// @flow
import { apply } from '../state/position';
import type { Position } from '../types';

// The browsers update document.documentElement.scrollTop and window.pageYOffset
// differently as the window scrolls.

// Webkit
// documentElement.scrollTop: no update. Stays at 0
// window.pageYOffset: updates to whole number

// Chrome
// documentElement.scrollTop: update with fractional value
// window.pageYOffset: update with fractional value

// FireFox
// documentElement.scrollTop: updates to whole number
// window.pageYOffset: updates to whole number

// IE11 (same as firefox)
// documentElement.scrollTop: updates to whole number
// window.pageYOffset: updates to whole number

// Edge (same as webkit)
// documentElement.scrollTop: no update. Stays at 0
// window.pageYOffset: updates to whole number

export default (): Position => ({
  x: window.pageXOffset,
  y: window.pageYOffset,
});

