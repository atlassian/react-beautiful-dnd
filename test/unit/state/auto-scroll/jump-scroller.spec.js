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

const origin: Position = { x: 0, y: 0 };

const windowScrollSize = {
  scrollHeight: 2000,
  scrollWidth: 1600,
};
const viewport: Area = getArea({
  top: 0,
  left: 0,
  right: 800,
  bottom: 1000,
});

describe('jump auto scrolling', () => {
  let autoScroller: AutoScroller;
  let mocks;

  beforeEach(() => {
    mocks = {
      scrollWindow: jest.fn(),
      scrollDroppable: jest.fn(),
      move: jest.fn(),
    };
    autoScroller = createAutoScroller(mocks);
    setViewport(viewport);
    setWindowScrollSize(windowScrollSize);
  });

  afterEach(() => {
    resetWindowScroll();
    resetWindowScrollSize();
    resetViewport();
    requestAnimationFrame.reset();
  });

  [vertical, horizontal].forEach((axis: Axis) => {
    describe(`on the ${axis.direction} axis`, () => {
      const preset = getPreset(axis);

      describe('window scrolling', () => {
        it('should not scroll if the item is bigger than the viewport', () => {

        });

        describe('moving forwards', () => {
          it('should manually move the item if the window is unable to scroll', () => {
            // disabling scroll
            setWindowScrollSize({
              scrollHeight: viewport.height,
              scrollWidth: viewport.width,
            });
            const request: Position = patch(axis.line, 1);
            const current: State = state.scrollJumpRequest(request);
            if (!current.drag) {
              throw new Error('invalid state');
            }
            const expected: Position = add(current.drag.current.client.selection, request);

            autoScroller.onStateChange(state.idle, current);

            expect(mocks.move).toHaveBeenCalledWith(
              preset.inHome1.descriptor.id,
              expected,
              origin,
              true,
            );
            expect(mocks.scrollWindow).not.toHaveBeenCalled();
          });

          it('should scroll the window if can absorb all of the movement', () => {
            const request: Position = patch(axis.line, 1);

            autoScroller.onStateChange(state.idle, state.scrollJumpRequest(request));

            expect(mocks.scrollWindow).toHaveBeenCalledWith(request);
            expect(mocks.move).not.toHaveBeenCalled();
          });

          it('should manually move the item any distance that the window is unable to scroll', () => {
            // only allowing scrolling by 1 px
            setWindowScrollSize({
              scrollHeight: viewport.height + 1,
              scrollWidth: viewport.width + 1,
            });
            // more than the 1 pixel allowed
            const request: Position = patch(axis.line, 3);
            const current: State = state.scrollJumpRequest(request);
            if (!current.drag) {
              throw new Error('invalid state');
            }
            const expected: Position = add(
              current.drag.current.client.selection,
              // the two pixels that could not be done by the window
              patch(axis.line, 2)
            );

            autoScroller.onStateChange(state.idle, state.scrollJumpRequest(request));

            // can scroll with what we have
            expect(mocks.scrollWindow).toHaveBeenCalledWith(patch(axis.line, 1));
            // remainder to be done by movement
            expect(mocks.move).toHaveBeenCalledWith(
              preset.inHome1.descriptor.id,
              expected,
              origin,
              true,
            );
          });
        });

        describe('moving backwards', () => {

        });
      });
    });
  });
});
