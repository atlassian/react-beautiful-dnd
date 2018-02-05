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
import setWindowScroll, { resetWindowScroll } from '../../../utils/set-window-scroll';
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
    resetWindowScroll();
    resetWindowScrollSize();
    resetViewport();
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

      [vertical, horizontal].forEach((axis: Axis) => {
        describe(`on the ${axis.direction} axis`, () => {
          type Case = {|
            name: string,
            scroll: (change: Position) => void,
            didScroll: () => boolean,
            area: Area,
          |}

          describe('window scrolling', () => {
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

              it('should scroll if moving beyond the start threshold', () => {
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
                // moving forwards
                const request: Position = mocks.scrollWindow.mock.calls[0][0];
                expect(request[axis.line]).toBeGreaterThan(0);
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

              it('should not scroll if the window cannot scroll', () => {
                setWindowScrollSize({
                  scrollHeight: viewport.height,
                  scrollWidth: viewport.width,
                });
                const target: Position = patch(
                  axis.line,
                  (viewport[axis.size] - thresholds.startFrom) + 1,
                  viewport.center[axis.crossLine],
                );

                autoScroller.onStateChange(state.idle, dragTo(target));

                requestAnimationFrame.step();
                expect(mocks.scrollWindow).not.toHaveBeenCalled();
              });
            });

            describe('moving backwards towards the start of window', () => {
              const windowScroll: Position = patch(axis.line, 10);
              beforeEach(() => {
                setWindowScroll(windowScroll);
              });

              it('should not scroll if not past the start threshold', () => {
                const target: Position = patch(
                  axis.line,
                  // at the boundary is not enough to start
                  windowScroll[axis.line] + (thresholds.startFrom),
                  viewport.center[axis.crossLine],
                );

                autoScroller.onStateChange(state.idle, dragTo(target));

                requestAnimationFrame.flush();
                expect(mocks.scrollWindow).not.toHaveBeenCalled();
              });

              it('should scroll if moving beyond the start threshold', () => {
                const target: Position = patch(
                  axis.line,
                  (windowScroll[axis.line] + thresholds.startFrom) - 1,
                  viewport.center[axis.crossLine],
                );

                autoScroller.onStateChange(state.idle, dragTo(target));

                expect(mocks.scrollWindow).not.toHaveBeenCalled();

                // only called after a frame
                requestAnimationFrame.step();
                expect(mocks.scrollWindow).toHaveBeenCalled();
                // moving backwards
                const request: Position = mocks.scrollWindow.mock.calls[0][0];
                expect(request[axis.line]).toBeLessThan(0);
              });

              it('should throttle multiple scrolls into a single animation frame', () => {
                const target1: Position = patch(
                  axis.line,
                  (windowScroll[axis.line] + thresholds.startFrom) - 1,
                  viewport.center[axis.crossLine],
                );
                const target2: Position = patch(
                  axis.line,
                  (windowScroll[axis.line] + thresholds.startFrom) - 2,
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
                  (windowScroll[axis.line] + thresholds.startFrom) - 1,
                  viewport.center[axis.crossLine],
                );
                const target2: Position = patch(
                  axis.line,
                  (windowScroll[axis.line] + thresholds.startFrom) - 2,
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

                // moving backwards so a smaller value is bigger
                expect(scroll1[axis.line]).toBeGreaterThan(scroll2[axis.line]);
                // or put another way:
                expect(Math.abs(scroll1[axis.line])).toBeLessThan(Math.abs(scroll2[axis.line]));

                // validation
                expect(scroll1[axis.crossLine]).toBe(0);
                expect(scroll2[axis.crossLine]).toBe(0);
              });

              it('should have the top speed at the max speed point', () => {
                const target: Position = patch(
                  axis.line,
                  (windowScroll[axis.line] + thresholds.maxSpeedAt),
                  viewport.center[axis.crossLine],
                );
                const expected: Position = patch(axis.line, -config.maxScrollSpeed);

                autoScroller.onStateChange(state.idle, dragTo(target));
                requestAnimationFrame.step();

                expect(mocks.scrollWindow).toHaveBeenCalledWith(expected);
              });

              it('should have the top speed when moving beyond the max speed point', () => {
                const target: Position = patch(
                  axis.line,
                  // gone beyond the max scroll at point
                  (windowScroll[axis.line] + thresholds.maxSpeedAt) - 1,
                  viewport.center[axis.crossLine],
                );
                const expected: Position = patch(axis.line, -config.maxScrollSpeed);

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
                  windowScroll[axis.line] + thresholds.maxSpeedAt,
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

              it('should not scroll if the window cannot scroll', () => {
                setWindowScrollSize({
                  scrollHeight: viewport.height,
                  scrollWidth: viewport.width,
                });
                const target: Position = patch(
                  axis.line,
                  (windowScroll[axis.line] + thresholds.startFrom) - 1,
                  viewport.center[axis.crossLine],
                );

                autoScroller.onStateChange(state.idle, dragTo(target));

                requestAnimationFrame.step();
                expect(mocks.scrollWindow).not.toHaveBeenCalled();
              });
            });

            // just some light tests to ensure that cross axis moving also works
            describe('moving forward on the cross axis', () => {
              const crossAxisThresholds: PixelThresholds = getPixelThresholds(
                viewport,
                axis === vertical ? horizontal : vertical,
              );

              it('should not scroll if not past the start threshold', () => {
                const target: Position = patch(
                  axis.line,
                  viewport.center[axis.line],
                  // to the boundary is not enough to start
                  (viewport[axis.crossAxisSize] - crossAxisThresholds.startFrom),
                );

                autoScroller.onStateChange(state.idle, dragTo(target));

                requestAnimationFrame.flush();
                expect(mocks.scrollWindow).not.toHaveBeenCalled();
              });

              it('should scroll if moving beyond the start threshold', () => {
                const target: Position = patch(
                  axis.line,
                  viewport.center[axis.line],
                  (viewport[axis.crossAxisSize] - crossAxisThresholds.startFrom) + 1,
                );

                autoScroller.onStateChange(state.idle, dragTo(target));

                expect(mocks.scrollWindow).not.toHaveBeenCalled();

                // only called after a frame
                requestAnimationFrame.step();
                expect(mocks.scrollWindow).toHaveBeenCalled();
                // moving forwards
                const request: Position = mocks.scrollWindow.mock.calls[0][0];
                expect(request[axis.crossLine]).toBeGreaterThan(0);
              });
            });

            describe('moving backward on the cross axis', () => {
              const windowScroll: Position = patch(axis.crossLine, 10);
              beforeEach(() => {
                setWindowScroll(windowScroll);
              });

              const crossAxisThresholds: PixelThresholds = getPixelThresholds(
                viewport,
                axis === vertical ? horizontal : vertical,
              );

              it('should not scroll if not past the start threshold', () => {
                const target: Position = patch(
                  axis.line,
                  viewport.center[axis.line],
                  // to the boundary is not enough to start
                  windowScroll[axis.crossLine] + (crossAxisThresholds.startFrom)
                );

                autoScroller.onStateChange(state.idle, dragTo(target));

                requestAnimationFrame.flush();
                expect(mocks.scrollWindow).not.toHaveBeenCalled();
              });

              it('should scroll if moving beyond the start threshold', () => {
                const target: Position = patch(
                  axis.line,
                  viewport.center[axis.line],
                  (windowScroll[axis.crossLine] + crossAxisThresholds.startFrom) - 1
                );

                autoScroller.onStateChange(state.idle, dragTo(target));

                expect(mocks.scrollWindow).not.toHaveBeenCalled();

                // only called after a frame
                requestAnimationFrame.step();
                expect(mocks.scrollWindow).toHaveBeenCalled();
                // moving backwards
                const request: Position = mocks.scrollWindow.mock.calls[0][0];
                expect(request[axis.crossLine]).toBeLessThan(0);
              });
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
    });
  });

  describe('jump scrolling', () => {

  });
});
