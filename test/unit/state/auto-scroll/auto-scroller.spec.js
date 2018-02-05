// @flow
import type {
  Area,
  Axis,
  Position,
  State,
  DraggableDimension,
  Spacing,
} from '../../../../src/types';
import type { AutoScroller } from '../../../../src/state/auto-scroll/auto-scroller-types';
import type { PixelThresholds } from '../../../../src/state/auto-scroll/create-fluid-scroller';
import { getPixelThresholds, config } from '../../../../src/state/auto-scroll/create-fluid-scroller';
import setViewport, { resetViewport } from '../../../utils/set-viewport';
import { patch } from '../../../../src/state/position';
import getArea from '../../../../src/state/get-area';
import setWindowScrollSize, { resetWindowScrollSize } from '../../../utils/set-window-scroll-size';
import { vertical, horizontal } from '../../../../src/state/axis';
import createAutoScroller from '../../../../src/state/auto-scroll/auto-scroller';
import * as state from '../../../utils/simple-state-preset';
import { getPreset } from '../../../utils/dimension';
import { expandByPosition } from '../../../../src/state/spacing';
import { getDraggableDimension } from '../../../../src/state/dimension';

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
        [vertical, horizontal].forEach((axis: Axis) => {
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
                const target1: Position = patch(
                  axis.line,
                  (viewport[axis.size] - thresholds.startFrom) + 1,
                  viewport.center[axis.crossLine],
                );
                const target2: Position = patch(
                  axis.line,
                  (viewport[axis.size] - thresholds.startFrom) + 2,
                  viewport.center[axis.crossLine],
                );

                autoScroller.onStateChange(state.idle, dragTo(target1));
                autoScroller.onStateChange(state.idle, dragTo(target2));

                expect(mocks.scrollWindow).not.toHaveBeenCalled();

                // only called after a frame
                requestAnimationFrame.step();
                expect(mocks.scrollWindow).toHaveBeenCalledTimes(1);

                // verification
                requestAnimationFrame.flush();
                expect(mocks.scrollWindow).toHaveBeenCalledTimes(1);

                // not testing value called as we are not exposing getRequired scroll
              });

              it('should get faster the closer to the max speed point', () => {
                const target1: Position = patch(
                  axis.line,
                  (viewport[axis.size] - thresholds.startFrom) + 1,
                  viewport.center[axis.crossLine],
                );
                const target2: Position = patch(
                  axis.line,
                  (viewport[axis.size] - thresholds.startFrom) + 2,
                  viewport.center[axis.crossLine],
                );

                autoScroller.onStateChange(state.idle, dragTo(target1));
                requestAnimationFrame.step();
                expect(mocks.scrollWindow).toHaveBeenCalledTimes(1);
                const scroll1: Position = (mocks.scrollWindow.mock.calls[0][0] : any);

                autoScroller.onStateChange(state.idle, dragTo(target2));
                requestAnimationFrame.step();
                expect(mocks.scrollWindow).toHaveBeenCalledTimes(2);
                const scroll2: Position = (mocks.scrollWindow.mock.calls[1][0] : any);

                expect(scroll1[axis.line]).toBeLessThan(scroll2[axis.line]);

                // validation
                expect(scroll1[axis.crossLine]).toBe(0);
                expect(scroll2[axis.crossLine]).toBe(0);
              });

              it('should have the top speed at the max speed point', () => {
                const target: Position = patch(
                  axis.line,
                  (viewport[axis.size] - thresholds.maxSpeedAt),
                  viewport.center[axis.crossLine],
                );
                const expected: Position = patch(axis.line, config.maxScrollSpeed);

                autoScroller.onStateChange(state.idle, dragTo(target));
                requestAnimationFrame.step();

                expect(mocks.scrollWindow).toHaveBeenCalledWith(expected);
              });

              it('should have the top speed when moving beyond the max speed point', () => {
                const target: Position = patch(
                  axis.line,
                  // gone beyond the max scroll at point
                  (viewport[axis.size] - thresholds.maxSpeedAt) + 1,
                  viewport.center[axis.crossLine],
                );
                const expected: Position = patch(axis.line, config.maxScrollSpeed);

                autoScroller.onStateChange(state.idle, dragTo(target));
                requestAnimationFrame.step();

                expect(mocks.scrollWindow).toHaveBeenCalledWith(expected);
              });

              it('should not scroll if the item is too big', () => {
                const expanded: Area = getArea(expandByPosition(viewport, { x: 1, y: 1 }));
                const tooBig: DraggableDimension = getDraggableDimension({
                  descriptor: {
                    id: 'too big',
                    droppableId: preset.home.descriptor.id,
                    // after the last item
                    index: preset.inHomeList.length,
                  },
                  client: expanded,
                });
                const selection: Position = patch(
                  axis.line,
                  // gone beyond the max scroll at point
                  (viewport[axis.size] - thresholds.maxSpeedAt),
                  viewport.center[axis.crossLine],
                );
                const custom: State = (() => {
                  const base: State = state.dragging(
                    preset.inHome1.descriptor.id,
                    selection,
                  );

                  return {
                    ...base,
                    drag: {
                      ...base.drag,
                      initial: {
                        // $ExpectError
                        ...base.drag.initial,
                        descriptor: tooBig.descriptor,
                      },
                    },
                    dimension: {
                      ...base.dimension,
                      draggable: {
                        ...base.dimension.draggable,
                        [tooBig.descriptor.id]: tooBig,
                      },
                    },
                  };
                })();

                autoScroller.onStateChange(state.idle, custom);

                requestAnimationFrame.flush();
                expect(mocks.scrollWindow).not.toHaveBeenCalled();
              });
            });

            describe('moving backwards towards the start of window', () => {

            });
          });
        });

        describe('it should not scroll if too big', () => {

        });
      });

      describe('droppable scrolling', () => {

      });

      describe('window scrolling before droppable scrolling', () => {
        // TODO: if window scrolling - do not droppable scroll
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
