// @flow
import type {
  Area,
  Axis,
  Position,
  State,
} from '../../../../src/types';
import type { AutoScroller } from '../../../../src/state/auto-scroll/auto-scroller-types';
import type { PixelThresholds } from '../../../../src/state/auto-scroll/create-fluid-scroller';
import { getPixelThresholds } from '../../../../src/state/auto-scroll/create-fluid-scroller';
import setViewport, { resetViewport } from '../../../utils/set-viewport';
import { patch } from '../../../../src/state/position';
import getArea from '../../../../src/state/get-area';
import setWindowScrollSize, { resetWindowScrollSize } from '../../../utils/set-window-scroll-size';
import { vertical, horizontal } from '../../../../src/state/axis';
import createAutoScroller from '../../../../src/state/auto-scroll/auto-scroller';
import * as state from '../../../utils/simple-state-preset';
import { getPreset } from '../../../utils/dimension';

describe('auto scroller', () => {
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
    // resetViewport();
    resetWindowScrollSize();
    requestAnimationFrame.reset();
  });

  describe('fluid scrolling', () => {
    describe('on drag', () => {
      const viewport: Area = getArea({
        top: 0,
        left: 0,
        right: 800,
        bottom: 1000,
      });

      beforeEach(() => {
        setViewport(viewport);
        setWindowScrollSize({
          scrollHeight: 2000,
          scrollWidth: 1600,
        });
      });

      describe('window scrolling', () => {
        [vertical].forEach((axis: Axis) => {
          describe(`on the ${axis.direction} axis`, () => {
            const preset = getPreset(axis);
            const thresholds: PixelThresholds = getPixelThresholds(viewport, axis);
            const dragTo = (selection: Position): State =>
              state.dragging(preset.inHome1.descriptor.id, selection);

            describe('moving forward to end of window', () => {
              it('should not scroll if not past the start threshold', () => {
                const target: Position = patch(
                  axis.line,
                  // to the boundary is not enough to start
                  (viewport[axis.size] - thresholds.startFrom),
                  viewport.center[axis.crossLine],
                );

                autoScroller.onStateChange(state.idle, dragTo(target));

                requestAnimationFrame.flush();
                expect(mocks.scrollWindow).not.toHaveBeenCalled();
              });

              it('should scroll if to the start threshold', () => {
                const target: Position = patch(
                  axis.line,
                  (viewport[axis.size] - thresholds.startFrom) + 1,
                  viewport.center[axis.crossLine],
                );

                autoScroller.onStateChange(state.idle, dragTo(target));

                expect(mocks.scrollWindow).not.toHaveBeenCalled();

                // only called after a frame
                requestAnimationFrame.step();
                expect(mocks.scrollWindow).toHaveBeenCalled();
              });

              it('should throttle multiple scrolls into a single animation frame', () => {

              });

              it('should get faster the closer to the max speed point', () => {

              });

              it('should have the top speed at the max speed point', () => {

              });

              it('should have the top speed when moving beyond the max speed point', () => {

              });
            });
          });
        });

        it('should not scroll the window if there is no required scroll', () => {

        });

        describe('window scroll speed', () => {
          it('should have a greater scroll speed the closer the user moves to the max speed point', () => {

          });

          it('should have the max scroll speed once the max speed point is exceeded', () => {

          });
        });

        describe('subject is too big for auto scrolling', () => {

        });
      });

      describe('droppable scrolling', () => {

      });

      describe('window scrolling before droppable scrolling', () => {

      });
    });

    describe('on drag end', () => {
      it('should cancel any pending window scroll', () => {

      });

      it('should cancel any pending droppable scroll', () => {

      });
    });
  });

  describe('jump scrolling', () => {

  });
});
