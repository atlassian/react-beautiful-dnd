// @flow
import { getRect } from 'css-box-model';
import type { Viewport } from '../../../../../../src/types';
import { origin } from '../../../../../../src/state/position';
import { createViewport } from '../../../../../util/viewport';

export const windowScrollSize = {
  scrollHeight: 2000,
  scrollWidth: 1600,
};
export const scrollableViewport: Viewport = createViewport({
  frame: getRect({
    top: 0,
    left: 0,
    right: 800,
    bottom: 1000,
  }),
  scrollHeight: windowScrollSize.scrollHeight,
  scrollWidth: windowScrollSize.scrollWidth,
  scroll: origin,
});

export const unscrollableViewport: Viewport = createViewport({
  frame: getRect({
    top: 0,
    left: 0,
    right: 800,
    bottom: 1000,
  }),
  scrollHeight: 1000,
  scrollWidth: 800,
  scroll: origin,
});
