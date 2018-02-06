// @flow
import type {
  Area,
  Axis,
  Position,
  State,
  DraggableDimension,
  DroppableDimension,
} from '../../../../src/types';
import type { AutoScroller } from '../../../../src/state/auto-scroll/auto-scroller-types';
import type { PixelThresholds } from '../../../../src/state/auto-scroll/create-fluid-scroller';
import { getPixelThresholds, config } from '../../../../src/state/auto-scroll/create-fluid-scroller';
import { add, patch, subtract } from '../../../../src/state/position';
import getArea from '../../../../src/state/get-area';
import setViewport, { resetViewport } from '../../../utils/set-viewport';
import setWindowScrollSize, { resetWindowScrollSize } from '../../../utils/set-window-scroll-size';
import setWindowScroll, { resetWindowScroll } from '../../../utils/set-window-scroll';
import { vertical, horizontal } from '../../../../src/state/axis';
import createAutoScroller from '../../../../src/state/auto-scroll/auto-scroller';
import * as state from '../../../utils/simple-state-preset';
import { getPreset } from '../../../utils/dimension';
import { expandByPosition } from '../../../../src/state/spacing';
import { getDraggableDimension, getDroppableDimension, scrollDroppable } from '../../../../src/state/dimension';

const windowScrollSize = {
  scrollHeight: 2000,
  scrollWidth: 1600,
};


describe('jump scroller', () => {
  let autoScroller: AutoScroller;
  let mocks;

  beforeEach(() => {
    mocks = {
      scrollWindow: jest.fn(),
      scrollDroppable: jest.fn(),
      move: jest.fn(),
    };
    autoScroller = createAutoScroller(mocks);
  });

  afterEach(() => {
    resetWindowScroll();
    resetWindowScrollSize();
    resetViewport();
    requestAnimationFrame.reset();
  });

  describe('window scrolling', () => {
    it('should not scroll if the item is bigger than the viewport', () => {

    });

    it('should manually move the item if the window is unable to scroll', () => {

    });

    it('should scroll the window if can absorb all of the movement', () => {

    });

    it('should manually move the item any distance that the window is unable to scroll', () => {

    });
  });
});