// @flow
import type {
  Area,
  Axis,
  Position,
  State,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
} from '../../../../src/types';
import type { AutoScroller } from '../../../../src/state/auto-scroller/auto-scroller-types';
import type { PixelThresholds } from '../../../../src/state/auto-scroller/fluid-scroller';
import { getPixelThresholds, config } from '../../../../src/state/auto-scroller/fluid-scroller';
import { add, patch, subtract } from '../../../../src/state/position';
import getArea from '../../../../src/state/get-area';
import setViewport, { resetViewport } from '../../../utils/set-viewport';
import setWindowScrollSize, { resetWindowScrollSize } from '../../../utils/set-window-scroll-size';
import setWindowScroll, { resetWindowScroll } from '../../../utils/set-window-scroll';
import noImpact, { noMovement } from '../../../../src/state/no-impact';
import { vertical, horizontal } from '../../../../src/state/axis';
import createAutoScroller from '../../../../src/state/auto-scroller/';
import getStatePreset from '../../../utils/get-simple-state-preset';
import {
  getInitialImpact,
  getClosestScrollable,
  getPreset,
  withImpact,
  addDraggable,
  addDroppable,
} from '../../../utils/dimension';
import { expandByPosition } from '../../../../src/state/spacing';
import { getDraggableDimension, getDroppableDimension, scrollDroppable } from '../../../../src/state/dimension';

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

describe('fluid auto scrolling', () => {
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
      const state = getStatePreset(axis);
      const scrollableScrollSize = {
        scrollWidth: 800,
        scrollHeight: 800,
      };
      const frame: Area = getArea({
        top: 0,
        left: 0,
        right: 600,
        bottom: 600,
      });

      const scrollable: DroppableDimension = getDroppableDimension({
        // stealing the home descriptor
        descriptor: preset.home.descriptor,
        direction: axis.direction,
        paddingBox: getArea({
          top: 0,
          left: 0,
          // bigger than the frame
          right: scrollableScrollSize.scrollWidth,
          bottom: scrollableScrollSize.scrollHeight,
        }),
        closest: {
          framePaddingBox: frame,
          scrollWidth: scrollableScrollSize.scrollWidth,
          scrollHeight: scrollableScrollSize.scrollHeight,
          scroll: { x: 0, y: 0 },
          shouldClipSubject: true,
        },
      });

      const dragTo = (
        selection: Position,
        // seeding that we are over the home droppable
        impact?: DragImpact = getInitialImpact(preset.inHome1, axis),
      ): State => withImpact(
        state.dragging(preset.inHome1.descriptor.id, selection),
        impact,
      );

      describe('window scrolling', () => {
        const thresholds: PixelThresholds = getPixelThresholds(viewport, axis);
        const crossAxisThresholds: PixelThresholds = getPixelThresholds(
          viewport,
          axis === vertical ? horizontal : vertical,
        );

        describe('moving forward to end of window', () => {
          const onStartBoundary: Position = patch(
            axis.line,
            // to the boundary is not enough to start
            (viewport[axis.size] - thresholds.startFrom),
            viewport.center[axis.crossAxisLine],
          );
          const onMaxBoundary: Position = patch(
            axis.line,
            (viewport[axis.size] - thresholds.maxSpeedAt),
            viewport.center[axis.crossAxisLine],
          );

          it('should not scroll if not past the start threshold', () => {
            autoScroller.onStateChange(state.idle, dragTo(onStartBoundary));

            requestAnimationFrame.flush();
            expect(mocks.scrollWindow).not.toHaveBeenCalled();
          });

          it('should scroll if moving beyond the start threshold', () => {
            const target: Position = add(onStartBoundary, patch(axis.line, 1));

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
            const target1: Position = add(onStartBoundary, patch(axis.line, 1));
            const target2: Position = add(onStartBoundary, patch(axis.line, 2));

            autoScroller.onStateChange(state.idle, dragTo(target1));
            autoScroller.onStateChange(dragTo(target1), dragTo(target2));

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
            const target1: Position = add(onStartBoundary, patch(axis.line, 1));
            const target2: Position = add(onStartBoundary, patch(axis.line, 2));

            autoScroller.onStateChange(state.idle, dragTo(target1));
            requestAnimationFrame.step();
            expect(mocks.scrollWindow).toHaveBeenCalledTimes(1);
            const scroll1: Position = (mocks.scrollWindow.mock.calls[0][0] : any);

            autoScroller.onStateChange(dragTo(target1), dragTo(target2));
            requestAnimationFrame.step();
            expect(mocks.scrollWindow).toHaveBeenCalledTimes(2);
            const scroll2: Position = (mocks.scrollWindow.mock.calls[1][0] : any);

            expect(scroll1[axis.line]).toBeLessThan(scroll2[axis.line]);

            // validation
            expect(scroll1[axis.crossAxisLine]).toBe(0);
            expect(scroll2[axis.crossAxisLine]).toBe(0);
          });

          it('should have the top speed at the max speed point', () => {
            const expected: Position = patch(axis.line, config.maxScrollSpeed);

            autoScroller.onStateChange(state.idle, dragTo(onMaxBoundary));
            requestAnimationFrame.step();

            expect(mocks.scrollWindow).toHaveBeenCalledWith(expected);
          });

          it('should have the top speed when moving beyond the max speed point', () => {
            const target: Position = add(onMaxBoundary, patch(axis.line, 1));
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
              paddingBox: expanded,
            });
            const selection: Position = onMaxBoundary;
            const custom: State = (() => {
              const base: State = state.dragging(
                preset.inHome1.descriptor.id,
                selection,
              );

              const updated: State = {
                ...base,
                drag: {
                  ...base.drag,
                  initial: {
                    // $ExpectError
                    ...base.drag.initial,
                    descriptor: tooBig.descriptor,
                  },
                },
              };

              return addDraggable(updated, tooBig);
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
            const target: Position = onMaxBoundary;

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

          const onStartBoundary: Position = patch(
            axis.line,
            // at the boundary is not enough to start
            windowScroll[axis.line] + thresholds.startFrom,
            viewport.center[axis.crossAxisLine],
          );
          const onMaxBoundary: Position = patch(
            axis.line,
            (windowScroll[axis.line] + thresholds.maxSpeedAt),
            viewport.center[axis.crossAxisLine],
          );

          it('should not scroll if not past the start threshold', () => {
            autoScroller.onStateChange(state.idle, dragTo(onStartBoundary));

            requestAnimationFrame.flush();
            expect(mocks.scrollWindow).not.toHaveBeenCalled();
          });

          it('should scroll if moving beyond the start threshold', () => {
            const target: Position = subtract(onStartBoundary, patch(axis.line, 1));

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
            const target1: Position = subtract(onStartBoundary, patch(axis.line, 1));
            const target2: Position = subtract(onStartBoundary, patch(axis.line, 2));

            autoScroller.onStateChange(state.idle, dragTo(target1));
            autoScroller.onStateChange(dragTo(target1), dragTo(target2));

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
            const target1: Position = subtract(onStartBoundary, patch(axis.line, 1));
            const target2: Position = subtract(onStartBoundary, patch(axis.line, 2));

            autoScroller.onStateChange(state.idle, dragTo(target1));
            requestAnimationFrame.step();
            expect(mocks.scrollWindow).toHaveBeenCalledTimes(1);
            const scroll1: Position = (mocks.scrollWindow.mock.calls[0][0] : any);

            autoScroller.onStateChange(dragTo(target1), dragTo(target2));
            requestAnimationFrame.step();
            expect(mocks.scrollWindow).toHaveBeenCalledTimes(2);
            const scroll2: Position = (mocks.scrollWindow.mock.calls[1][0] : any);

            // moving backwards so a smaller value is bigger
            expect(scroll1[axis.line]).toBeGreaterThan(scroll2[axis.line]);
            // or put another way:
            expect(Math.abs(scroll1[axis.line])).toBeLessThan(Math.abs(scroll2[axis.line]));

            // validation
            expect(scroll1[axis.crossAxisLine]).toBe(0);
            expect(scroll2[axis.crossAxisLine]).toBe(0);
          });

          it('should have the top speed at the max speed point', () => {
            const target: Position = onMaxBoundary;
            const expected: Position = patch(axis.line, -config.maxScrollSpeed);

            autoScroller.onStateChange(state.idle, dragTo(target));
            requestAnimationFrame.step();

            expect(mocks.scrollWindow).toHaveBeenCalledWith(expected);
          });

          it('should have the top speed when moving beyond the max speed point', () => {
            const target: Position = subtract(onMaxBoundary, patch(axis.line, 1));
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
              paddingBox: expanded,
            });
            const selection: Position = onMaxBoundary;
            const custom: State = (() => {
              const base: State = state.dragging(
                preset.inHome1.descriptor.id,
                selection,
              );

              const updated: State = {
                ...base,
                drag: {
                  ...base.drag,
                  initial: {
                    // $ExpectError
                    ...base.drag.initial,
                    descriptor: tooBig.descriptor,
                  },
                },
              };

              return addDraggable(updated, tooBig);
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
            const target: Position = onMaxBoundary;

            autoScroller.onStateChange(state.idle, dragTo(target));

            requestAnimationFrame.step();
            expect(mocks.scrollWindow).not.toHaveBeenCalled();
          });
        });

        // just some light tests to ensure that cross axis moving also works
        describe('moving forward on the cross axis', () => {
          const onStartBoundary: Position = patch(
            axis.line,
            viewport.center[axis.line],
            // to the boundary is not enough to start
            (viewport[axis.crossAxisSize] - crossAxisThresholds.startFrom),
          );

          it('should not scroll if not past the start threshold', () => {
            autoScroller.onStateChange(state.idle, dragTo(onStartBoundary));

            requestAnimationFrame.flush();
            expect(mocks.scrollWindow).not.toHaveBeenCalled();
          });

          it('should scroll if moving beyond the start threshold', () => {
            const target: Position = add(onStartBoundary, patch(axis.crossAxisLine, 1));

            autoScroller.onStateChange(state.idle, dragTo(target));

            expect(mocks.scrollWindow).not.toHaveBeenCalled();

            // only called after a frame
            requestAnimationFrame.step();
            expect(mocks.scrollWindow).toHaveBeenCalled();
            // moving forwards
            const request: Position = mocks.scrollWindow.mock.calls[0][0];
            expect(request[axis.crossAxisLine]).toBeGreaterThan(0);
          });
        });

        // just some light tests to ensure that cross axis moving also works
        describe('moving backward on the cross axis', () => {
          const windowScroll: Position = patch(axis.crossAxisLine, 10);
          beforeEach(() => {
            setWindowScroll(windowScroll);
          });

          const onStartBoundary: Position = patch(
            axis.line,
            viewport.center[axis.line],
            // to the boundary is not enough to start
            windowScroll[axis.crossAxisLine] + (crossAxisThresholds.startFrom)
          );

          it('should not scroll if not past the start threshold', () => {
            autoScroller.onStateChange(state.idle, dragTo(onStartBoundary));

            requestAnimationFrame.flush();
            expect(mocks.scrollWindow).not.toHaveBeenCalled();
          });

          it('should scroll if moving beyond the start threshold', () => {
            const target: Position = subtract(onStartBoundary, patch(axis.crossAxisLine, 1));

            autoScroller.onStateChange(state.idle, dragTo(target));

            expect(mocks.scrollWindow).not.toHaveBeenCalled();

            // only called after a frame
            requestAnimationFrame.step();
            expect(mocks.scrollWindow).toHaveBeenCalled();
            // moving backwards
            const request: Position = mocks.scrollWindow.mock.calls[0][0];
            expect(request[axis.crossAxisLine]).toBeLessThan(0);
          });
        });

        describe('big draggable', () => {
          const onMaxBoundaryOfBoth: Position = patch(
            axis.line,
            (viewport[axis.size] - thresholds.maxSpeedAt),
            (viewport[axis.crossAxisSize] - crossAxisThresholds.maxSpeedAt),
          );

          describe('bigger on the main axis', () => {
            it('should not allow scrolling on the main axis, but allow scrolling on the cross axis', () => {
              const expanded: Area = getArea(expandByPosition(viewport, patch(axis.line, 1)));
              const tooBigOnMainAxis: DraggableDimension = getDraggableDimension({
                descriptor: {
                  id: 'too big',
                  droppableId: preset.home.descriptor.id,
                  // after the last item
                  index: preset.inHomeList.length,
                },
                paddingBox: expanded,
              });

              const selection: Position = onMaxBoundaryOfBoth;
              const custom: State = (() => {
                const base: State = state.dragging(
                  preset.inHome1.descriptor.id,
                  selection,
                );

                const updated: State = {
                  ...base,
                  drag: {
                    ...base.drag,
                    initial: {
                      // $ExpectError
                      ...base.drag.initial,
                      descriptor: tooBigOnMainAxis.descriptor,
                    },
                  },
                };

                return addDraggable(updated, tooBigOnMainAxis);
              })();

              autoScroller.onStateChange(state.idle, custom);

              requestAnimationFrame.step();
              expect(mocks.scrollWindow).toHaveBeenCalledWith(
                // scroll ocurred on the cross axis, but not on the main axis
                patch(axis.crossAxisLine, config.maxScrollSpeed)
              );
            });
          });

          describe('bigger on the cross axis', () => {
            it('should not allow scrolling on the cross axis, but allow scrolling on the main axis', () => {
              const expanded: Area = getArea(
                expandByPosition(viewport, patch(axis.crossAxisLine, 1))
              );
              const tooBigOnCrossAxis: DraggableDimension = getDraggableDimension({
                descriptor: {
                  id: 'too big',
                  droppableId: preset.home.descriptor.id,
                  // after the last item
                  index: preset.inHomeList.length,
                },
                paddingBox: expanded,
              });

              const selection: Position = onMaxBoundaryOfBoth;
              const custom: State = (() => {
                const base: State = state.dragging(
                  preset.inHome1.descriptor.id,
                  selection,
                );

                const updated: State = {
                  ...base,
                  drag: {
                    ...base.drag,
                    initial: {
                      // $ExpectError
                      ...base.drag.initial,
                      descriptor: tooBigOnCrossAxis.descriptor,
                    },
                  },
                };

                return addDraggable(updated, tooBigOnCrossAxis);
              })();

              autoScroller.onStateChange(state.idle, custom);

              requestAnimationFrame.step();
              expect(mocks.scrollWindow).toHaveBeenCalledWith(
                // scroll ocurred on the main axis, but not on the cross axis
                patch(axis.line, config.maxScrollSpeed)
              );
            });
          });

          describe('bigger on both axis', () => {
            it('should not allow scrolling on any axis', () => {
              const expanded: Area = getArea(
                expandByPosition(viewport, patch(axis.line, 1, 1))
              );
              const tooBig: DraggableDimension = getDraggableDimension({
                descriptor: {
                  id: 'too big',
                  droppableId: preset.home.descriptor.id,
                  // after the last item
                  index: preset.inHomeList.length,
                },
                paddingBox: expanded,
              });

              const selection: Position = onMaxBoundaryOfBoth;
              const custom: State = (() => {
                const base: State = state.dragging(
                  preset.inHome1.descriptor.id,
                  selection,
                );

                const updated: State = {
                  ...base,
                  drag: {
                    ...base.drag,
                    initial: {
                      // $ExpectError
                      ...base.drag.initial,
                      descriptor: tooBig.descriptor,
                    },
                  },
                };

                return addDraggable(updated, tooBig);
              })();

              autoScroller.onStateChange(state.idle, custom);

              requestAnimationFrame.step();
              expect(mocks.scrollWindow).not.toHaveBeenCalled();
            });
          });
        });
      });

      describe('droppable scrolling', () => {
        const thresholds: PixelThresholds = getPixelThresholds(frame, axis);
        const crossAxisThresholds: PixelThresholds = getPixelThresholds(
          frame,
          axis === vertical ? horizontal : vertical
        );
        const maxScrollSpeed: Position = patch(axis.line, config.maxScrollSpeed);

        beforeEach(() => {
          // avoiding any window scrolling
          setWindowScrollSize({
            scrollHeight: viewport.height,
            scrollWidth: viewport.width,
          });
        });

        describe('moving forward to end of droppable', () => {
          const onStartBoundary: Position = patch(
            axis.line,
            // to the boundary is not enough to start
            (frame[axis.size] - thresholds.startFrom),
            frame.center[axis.crossAxisLine],
          );
          const onMaxBoundary: Position = patch(
            axis.line,
            (frame[axis.size] - thresholds.maxSpeedAt),
            frame.center[axis.crossAxisLine],
          );
          const onEndOfFrame: Position = patch(
            axis.line,
            frame[axis.size],
            frame.center[axis.crossAxisLine],
          );

          it('should not scroll if not past the start threshold', () => {
            autoScroller.onStateChange(
              state.idle,
              addDroppable(dragTo(onStartBoundary), scrollable)
            );

            requestAnimationFrame.flush();
            expect(mocks.scrollDroppable).not.toHaveBeenCalled();
          });

          it('should scroll if moving beyond the start threshold', () => {
            const target: Position = add(onStartBoundary, patch(axis.line, 1));

            autoScroller.onStateChange(
              state.idle,
              addDroppable(dragTo(target), scrollable),
            );

            expect(mocks.scrollDroppable).not.toHaveBeenCalled();

            // only called after a frame
            requestAnimationFrame.step();
            expect(mocks.scrollDroppable).toHaveBeenCalled();
            // moving forwards
            const [id, scroll] = mocks.scrollDroppable.mock.calls[0];

            expect(id).toBe(scrollable.descriptor.id);
            expect(scroll[axis.line]).toBeGreaterThan(0);
            expect(scroll[axis.crossAxisLine]).toBe(0);
          });

          it('should throttle multiple scrolls into a single animation frame', () => {
            const target1: Position = add(onStartBoundary, patch(axis.line, 1));
            const target2: Position = add(onStartBoundary, patch(axis.line, 2));

            autoScroller.onStateChange(
              state.idle,
              addDroppable(dragTo(target1), scrollable),
            );
            autoScroller.onStateChange(
              addDroppable(dragTo(target1), scrollable),
              addDroppable(dragTo(target2), scrollable),
            );

            expect(mocks.scrollDroppable).not.toHaveBeenCalled();

            // only called after a frame
            requestAnimationFrame.step();
            expect(mocks.scrollDroppable).toHaveBeenCalledTimes(1);

            // verification
            requestAnimationFrame.flush();
            expect(mocks.scrollDroppable).toHaveBeenCalledTimes(1);

            // not testing value called as we are not exposing getRequired scroll
          });

          it('should get faster the closer to the max speed point', () => {
            const target1: Position = add(onStartBoundary, patch(axis.line, 1));
            const target2: Position = add(onStartBoundary, patch(axis.line, 2));

            autoScroller.onStateChange(
              state.idle,
              addDroppable(dragTo(target1), scrollable),
            );
            requestAnimationFrame.step();
            expect(mocks.scrollDroppable).toHaveBeenCalledTimes(1);
            const scroll1: Position = (mocks.scrollDroppable.mock.calls[0][1] : any);

            autoScroller.onStateChange(
              addDroppable(dragTo(target1), scrollable),
              addDroppable(dragTo(target2), scrollable),
            );
            requestAnimationFrame.step();
            expect(mocks.scrollDroppable).toHaveBeenCalledTimes(2);
            const scroll2: Position = (mocks.scrollDroppable.mock.calls[1][1] : any);

            expect(scroll1[axis.line]).toBeLessThan(scroll2[axis.line]);

            // validation
            expect(scroll1[axis.crossAxisLine]).toBe(0);
            expect(scroll2[axis.crossAxisLine]).toBe(0);
          });

          it('should have the top speed at the max speed point', () => {
            const expected: Position = patch(axis.line, config.maxScrollSpeed);

            autoScroller.onStateChange(
              state.idle,
              addDroppable(dragTo(onMaxBoundary), scrollable),
            );
            requestAnimationFrame.step();

            expect(mocks.scrollDroppable).toHaveBeenCalledWith(
              scrollable.descriptor.id,
              expected
            );
          });

          it('should have the top speed when moving beyond the max speed point', () => {
            const target: Position = add(onMaxBoundary, patch(axis.line, 1));
            const expected: Position = patch(axis.line, config.maxScrollSpeed);

            autoScroller.onStateChange(
              state.idle,
              addDroppable(dragTo(target), scrollable),
            );
            requestAnimationFrame.step();

            expect(mocks.scrollDroppable).toHaveBeenCalledWith(
              scrollable.descriptor.id,
              expected
            );
          });

          it('should allow scrolling to the end of the droppable', () => {
            const target: Position = onEndOfFrame;
            // scrolling to max scroll point
            const maxChange: Position = getClosestScrollable(scrollable).scroll.max;
            const scrolled: DroppableDimension = scrollDroppable(scrollable, maxChange);

            autoScroller.onStateChange(
              state.idle,
              addDroppable(dragTo(target), scrolled),
            );
            requestAnimationFrame.flush();

            expect(mocks.scrollDroppable).not.toHaveBeenCalled();
          });

          describe('big draggable', () => {
            const onMaxBoundaryOfBoth: Position = patch(
              axis.line,
              (frame[axis.size] - thresholds.maxSpeedAt),
              (frame[axis.crossAxisSize] - crossAxisThresholds.maxSpeedAt),
            );

            describe('bigger on the main axis', () => {
              it('should not allow scrolling on the main axis, but allow scrolling on the cross axis', () => {
                const expanded: Area = getArea(expandByPosition(frame, patch(axis.line, 1)));
                const tooBigOnMainAxis: DraggableDimension = getDraggableDimension({
                  descriptor: {
                    id: 'too big',
                    droppableId: preset.home.descriptor.id,
                    // after the last item
                    index: preset.inHomeList.length,
                  },
                  paddingBox: expanded,
                });

                const selection: Position = onMaxBoundaryOfBoth;
                const custom: State = (() => {
                  const base: State = state.dragging(
                    preset.inHome1.descriptor.id,
                    selection,
                  );

                  const updated: State = {
                    ...base,
                    drag: {
                      ...base.drag,
                      initial: {
                        // $ExpectError
                        ...base.drag.initial,
                        descriptor: tooBigOnMainAxis.descriptor,
                      },
                    },
                  };

                  return addDroppable(addDraggable(updated, tooBigOnMainAxis), scrollable);
                })();

                autoScroller.onStateChange(state.idle, custom);

                requestAnimationFrame.flush();
                expect(mocks.scrollDroppable).toHaveBeenCalledWith(
                  scrollable.descriptor.id,
                  // scroll ocurred on the cross axis, but not on the main axis
                  patch(axis.crossAxisLine, config.maxScrollSpeed)
                );
              });
            });

            describe('bigger on the cross axis', () => {
              it('should not allow scrolling on the cross axis, but allow scrolling on the main axis', () => {
                const expanded: Area = getArea(
                  expandByPosition(frame, patch(axis.crossAxisLine, 1))
                );
                const tooBigOnCrossAxis: DraggableDimension = getDraggableDimension({
                  descriptor: {
                    id: 'too big',
                    droppableId: preset.home.descriptor.id,
                    // after the last item
                    index: preset.inHomeList.length,
                  },
                  paddingBox: expanded,
                });

                const selection: Position = onMaxBoundaryOfBoth;
                const custom: State = (() => {
                  const base: State = state.dragging(
                    preset.inHome1.descriptor.id,
                    selection,
                  );

                  const updated: State = {
                    ...base,
                    drag: {
                      ...base.drag,
                      initial: {
                        // $ExpectError
                        ...base.drag.initial,
                        descriptor: tooBigOnCrossAxis.descriptor,
                      },
                    },
                  };

                  return addDroppable(addDraggable(updated, tooBigOnCrossAxis), scrollable);
                })();

                autoScroller.onStateChange(state.idle, custom);

                requestAnimationFrame.flush();
                expect(mocks.scrollDroppable).toHaveBeenCalledWith(
                  scrollable.descriptor.id,
                  // scroll ocurred on the main axis, but not on the cross axis
                  patch(axis.line, config.maxScrollSpeed)
                );
              });
            });

            describe('bigger on both axis', () => {
              it('should not allow scrolling on the cross axis, but allow scrolling on the main axis', () => {
                const expanded: Area = getArea(
                  expandByPosition(frame, patch(axis.line, 1, 1))
                );
                const tooBig: DraggableDimension = getDraggableDimension({
                  descriptor: {
                    id: 'too big',
                    droppableId: preset.home.descriptor.id,
                    // after the last item
                    index: preset.inHomeList.length,
                  },
                  paddingBox: expanded,
                });

                const selection: Position = onMaxBoundaryOfBoth;
                const custom: State = (() => {
                  const base: State = state.dragging(
                    preset.inHome1.descriptor.id,
                    selection,
                  );

                  const updated: State = {
                    ...base,
                    drag: {
                      ...base.drag,
                      initial: {
                        // $ExpectError
                        ...base.drag.initial,
                        descriptor: tooBig.descriptor,
                      },
                    },
                  };

                  return addDroppable(addDraggable(updated, tooBig), scrollable);
                })();

                autoScroller.onStateChange(state.idle, custom);

                requestAnimationFrame.step();
                expect(mocks.scrollDroppable).not.toHaveBeenCalled();
              });
            });
          });

          describe('over home list', () => {
            it('should not scroll if the droppable if moving past the end of the frame', () => {
              const target: Position = add(onEndOfFrame, patch(axis.line, 1));
              // scrolling to max scroll point
              const maxChange: Position = getClosestScrollable(scrollable).scroll.max;
              const scrolled: DroppableDimension = scrollDroppable(scrollable, maxChange);

              autoScroller.onStateChange(
                state.idle,
                addDroppable(dragTo(target), scrolled),
              );
              requestAnimationFrame.flush();

              expect(mocks.scrollDroppable).not.toHaveBeenCalled();
            });
          });

          describe('over foreign list', () => {
            // $ExpectError - using spread
            const foreign: DroppableDimension = {
              ...scrollable,
              descriptor: preset.foreign.descriptor,
            };
            const placeholder: Position = patch(
              axis.line,
              preset.inHome1.placeholder.paddingBox[axis.size],
            );
            const overForeign: DragImpact = {
              movement: noMovement,
              direction: foreign.axis.direction,
              destination: {
                index: 0,
                droppableId: foreign.descriptor.id,
              },
            };

            it('should allow scrolling up to the end of the frame + the size of the placeholder', () => {
              // scrolling to just before the end of the placeholder
              // this goes beyond the usual max scroll.
              const scroll: Position = add(
                // usual max scroll
                getClosestScrollable(foreign).scroll.max,
                // with a small bit of room towards the end of the placeholder space
                subtract(placeholder, patch(axis.line, 1))
              );
              const scrolledForeign: DroppableDimension = scrollDroppable(foreign, scroll);
              const target: Position = add(onEndOfFrame, placeholder);
              const expected: Position = patch(axis.line, config.maxScrollSpeed);

              autoScroller.onStateChange(
                state.idle,
                addDroppable(dragTo(target, overForeign), scrolledForeign),
              );
              requestAnimationFrame.step();

              expect(mocks.scrollDroppable).toHaveBeenCalledWith(foreign.descriptor.id, expected);
            });

            it('should not allow scrolling past the placeholder buffer', () => {
              // already on the placeholder
              const scroll: Position = add(
                // usual max scroll
                getClosestScrollable(foreign).scroll.max,
                // with the placeholder
                placeholder,
              );
              const scrolledForeign: DroppableDimension = scrollDroppable(foreign, scroll);
              // targeting beyond the placeholder
              const target: Position = add(
                add(onEndOfFrame, placeholder),
                patch(axis.line, 1),
              );

              autoScroller.onStateChange(
                state.idle,
                addDroppable(dragTo(target, overForeign), scrolledForeign),
              );
              requestAnimationFrame.flush();

              expect(mocks.scrollDroppable).not.toHaveBeenCalled();
            });
          });
        });

        describe('moving backward to the start of droppable', () => {
          const droppableScroll: Position = patch(axis.line, 10);
          const scrolled: DroppableDimension = scrollDroppable(scrollable, droppableScroll);

          const onStartBoundary: Position = patch(
            axis.line,
            // to the boundary is not enough to start
            (frame[axis.start] + thresholds.startFrom),
            frame.center[axis.crossAxisLine],
          );
          const onMaxBoundary: Position = patch(
            axis.line,
            (frame[axis.start] + thresholds.maxSpeedAt),
            frame.center[axis.crossAxisLine],
          );

          it('should not scroll if not past the start threshold', () => {
            autoScroller.onStateChange(
              state.idle,
              addDroppable(dragTo(onStartBoundary), scrolled)
            );

            requestAnimationFrame.flush();
            expect(mocks.scrollDroppable).not.toHaveBeenCalled();
          });

          it('should scroll if moving beyond the start threshold', () => {
            // going backwards
            const target: Position = subtract(onStartBoundary, patch(axis.line, 1));

            autoScroller.onStateChange(
              state.idle,
              addDroppable(dragTo(target), scrolled),
            );

            expect(mocks.scrollDroppable).not.toHaveBeenCalled();

            // only called after a frame
            requestAnimationFrame.step();
            expect(mocks.scrollDroppable).toHaveBeenCalled();
            const [id, scroll] = mocks.scrollDroppable.mock.calls[0];

            // validation
            expect(id).toBe(scrollable.descriptor.id);
            // moving backwards
            expect(scroll[axis.line]).toBeLessThan(0);
            expect(scroll[axis.crossAxisLine]).toBe(0);
          });

          it('should throttle multiple scrolls into a single animation frame', () => {
            const target1: Position = subtract(onStartBoundary, patch(axis.line, 1));
            const target2: Position = subtract(onStartBoundary, patch(axis.line, 2));

            autoScroller.onStateChange(
              state.idle,
              addDroppable(dragTo(target1), scrolled),
            );
            autoScroller.onStateChange(
              addDroppable(dragTo(target1), scrolled),
              addDroppable(dragTo(target2), scrolled),
            );

            expect(mocks.scrollDroppable).not.toHaveBeenCalled();

            // only called after a frame
            requestAnimationFrame.step();
            expect(mocks.scrollDroppable).toHaveBeenCalledTimes(1);

            // verification
            requestAnimationFrame.flush();
            expect(mocks.scrollDroppable).toHaveBeenCalledTimes(1);

            // not testing value called as we are not exposing getRequired scroll
          });

          it('should get faster the closer to the max speed point', () => {
            const target1: Position = subtract(onStartBoundary, patch(axis.line, 1));
            const target2: Position = subtract(onStartBoundary, patch(axis.line, 2));

            autoScroller.onStateChange(
              state.idle,
              addDroppable(dragTo(target1), scrolled),
            );
            requestAnimationFrame.step();
            expect(mocks.scrollDroppable).toHaveBeenCalledTimes(1);
            const scroll1: Position = (mocks.scrollDroppable.mock.calls[0][1] : any);

            autoScroller.onStateChange(
              addDroppable(dragTo(target1), scrolled),
              addDroppable(dragTo(target2), scrolled),
            );
            requestAnimationFrame.step();
            expect(mocks.scrollDroppable).toHaveBeenCalledTimes(2);
            const scroll2: Position = (mocks.scrollDroppable.mock.calls[1][1] : any);

            // moving backwards
            expect(scroll1[axis.line]).toBeGreaterThan(scroll2[axis.line]);

            // validation
            expect(scroll1[axis.crossAxisLine]).toBe(0);
            expect(scroll2[axis.crossAxisLine]).toBe(0);
          });

          it('should have the top speed at the max speed point', () => {
            const expected: Position = patch(axis.line, -config.maxScrollSpeed);

            autoScroller.onStateChange(
              state.idle,
              addDroppable(dragTo(onMaxBoundary), scrolled),
            );
            requestAnimationFrame.step();

            expect(mocks.scrollDroppable).toHaveBeenCalledWith(
              scrollable.descriptor.id,
              expected
            );
          });

          it('should have the top speed when moving beyond the max speed point', () => {
            const target: Position = subtract(onMaxBoundary, patch(axis.line, 1));
            const expected: Position = patch(axis.line, -config.maxScrollSpeed);

            autoScroller.onStateChange(
              state.idle,
              addDroppable(dragTo(target), scrolled),
            );
            requestAnimationFrame.step();

            expect(mocks.scrollDroppable).toHaveBeenCalledWith(
              scrollable.descriptor.id,
              expected
            );
          });

          it('should not scroll if the item is too big', () => {
            const expanded: Area = getArea(expandByPosition(frame, { x: 1, y: 1 }));
            const tooBig: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'too big',
                droppableId: preset.home.descriptor.id,
                // after the last item
                index: preset.inHomeList.length,
              },
              paddingBox: expanded,
            });
            const selection: Position = onMaxBoundary;
            const custom: State = (() => {
              const base: State = state.dragging(
                preset.inHome1.descriptor.id,
                selection,
              );

              const updated: State = {
                ...base,
                drag: {
                  ...base.drag,
                  initial: {
                    // $ExpectError
                    ...base.drag.initial,
                    descriptor: tooBig.descriptor,
                  },
                },
              };

              return addDroppable(addDraggable(updated, tooBig), scrolled);
            })();

            autoScroller.onStateChange(state.idle, custom);

            requestAnimationFrame.flush();
            expect(mocks.scrollDroppable).not.toHaveBeenCalled();
          });

          it('should not scroll if the droppable is unable to be scrolled', () => {
            const target: Position = onMaxBoundary;
            if (!scrollable.viewport.closestScrollable) {
              throw new Error('Invalid test setup');
            }
            // scrolling to max scroll point

            autoScroller.onStateChange(
              state.idle,
              // scrollable cannot be scrolled backwards
              addDroppable(dragTo(target), scrollable)
            );
            requestAnimationFrame.flush();

            expect(mocks.scrollDroppable).not.toHaveBeenCalled();
          });
        });

        // just some light tests to ensure that cross axis moving also works
        describe('moving forward on the cross axis', () => {
          const droppableScroll: Position = patch(axis.crossAxisLine, 10);
          const scrolled: DroppableDimension = scrollDroppable(scrollable, droppableScroll);

          const onStartBoundary: Position = patch(
            axis.line,
            frame.center[axis.line],
            // to the boundary is not enough to start
            (frame[axis.crossAxisSize] - crossAxisThresholds.startFrom),
          );

          it('should not scroll if not past the start threshold', () => {
            autoScroller.onStateChange(state.idle, dragTo(onStartBoundary));

            requestAnimationFrame.flush();
            expect(mocks.scrollDroppable).not.toHaveBeenCalled();
          });

          it('should scroll if moving beyond the start threshold', () => {
            const target: Position = add(onStartBoundary, patch(axis.crossAxisLine, 1));

            autoScroller.onStateChange(
              state.idle,
              addDroppable(dragTo(target), scrolled),
            );

            expect(mocks.scrollDroppable).not.toHaveBeenCalled();

            // only called after a frame
            requestAnimationFrame.step();
            expect(mocks.scrollDroppable).toHaveBeenCalled();
            // moving forwards
            const [id, scroll] = mocks.scrollDroppable.mock.calls[0];

            expect(id).toBe(scrolled.descriptor.id);
            expect(scroll[axis.crossAxisLine]).toBeGreaterThan(0);
          });
        });

        // just some light tests to ensure that cross axis moving also works
        describe('moving backward on the cross axis', () => {
          const droppableScroll: Position = patch(axis.crossAxisLine, 10);
          const scrolled: DroppableDimension = scrollDroppable(scrollable, droppableScroll);

          const onStartBoundary: Position = patch(
            axis.line,
            frame.center[axis.line],
            // to the boundary is not enough to start
            (frame[axis.crossAxisStart] + crossAxisThresholds.startFrom)
          );

          it('should not scroll if not past the start threshold', () => {
            autoScroller.onStateChange(
              state.idle,
              addDroppable(dragTo(onStartBoundary), scrolled),
            );

            requestAnimationFrame.flush();
            expect(mocks.scrollDroppable).not.toHaveBeenCalled();
          });

          it('should scroll if moving beyond the start threshold', () => {
            const target: Position = subtract(onStartBoundary, patch(axis.crossAxisLine, 1));

            autoScroller.onStateChange(
              state.idle,
              addDroppable(dragTo(target), scrolled),
            );

            expect(mocks.scrollDroppable).not.toHaveBeenCalled();

            // only called after a frame
            requestAnimationFrame.step();
            expect(mocks.scrollDroppable).toHaveBeenCalled();
            // moving backwards
            const request: Position = mocks.scrollDroppable.mock.calls[0][1];
            expect(request[axis.crossAxisLine]).toBeLessThan(0);
          });
        });

        describe('over frame but not a subject', () => {
          const withSmallSubject: DroppableDimension = getDroppableDimension({
            // stealing the home descriptor
            descriptor: preset.home.descriptor,
            direction: axis.direction,
            paddingBox: getArea({
              top: 0,
              left: 0,
              right: 100,
              bottom: 100,
            }),
            closest: {
              framePaddingBox: getArea({
                top: 0,
                left: 0,
                right: 5000,
                bottom: 5000,
              }),
              scrollWidth: 10000,
              scrollHeight: 10000,
              scroll: { x: 0, y: 0 },
              shouldClipSubject: true,
            },
          });

          const endOfSubject: Position = patch(axis.line, 100);
          const endOfFrame: Position = patch(
            axis.line,
            // on the end
            5000,
            // half way
            2500,
          );

          it('should scroll a frame if it is being dragged over, even if not over the subject', () => {
            const scrolled: DroppableDimension = scrollDroppable(
              withSmallSubject,
              // scrolling the whole client away
              endOfSubject,
            );
            // subject no longer visible
            expect(scrolled.viewport.clipped).toBe(null);
            // const target: Position = add(endOfFrame, patch(axis.line, 1));

            autoScroller.onStateChange(
              state.idle,
              withImpact(
                addDroppable(dragTo(endOfFrame), scrolled),
                // being super clear that we are not currently over any droppable
                noImpact,
              )
            );
            requestAnimationFrame.step();

            expect(mocks.scrollDroppable).toHaveBeenCalledWith(
              scrolled.descriptor.id,
              maxScrollSpeed,
            );
          });

          it('should not scroll the frame if not over the frame', () => {
            const scrolled: DroppableDimension = scrollDroppable(
              withSmallSubject,
              // scrolling the whole client away
              endOfSubject,
            );
            // subject no longer visible
            expect(scrolled.viewport.clipped).toBe(null);
            const target: Position = add(endOfFrame, patch(axis.line, 1));

            autoScroller.onStateChange(
              state.idle,
              withImpact(
                addDroppable(dragTo(target), scrolled),
                // being super clear that we are not currently over any droppable
                noImpact,
              )
            );
            requestAnimationFrame.step();

            expect(mocks.scrollDroppable).not.toHaveBeenCalled();
          });
        });
      });

      describe('window scrolling before droppable scrolling', () => {
        const custom: DroppableDimension = getDroppableDimension({
          descriptor: {
            id: 'scrollable that is similiar to the viewport',
            type: 'TYPE',
          },
          paddingBox: getArea({
            top: 0,
            left: 0,
            // bigger than the frame
            right: windowScrollSize.scrollWidth,
            bottom: windowScrollSize.scrollHeight,
          }),
          closest: {
            framePaddingBox: viewport,
            scrollWidth: windowScrollSize.scrollWidth,
            scrollHeight: windowScrollSize.scrollHeight,
            scroll: { x: 0, y: 0 },
            shouldClipSubject: true,
          },
        });
        const thresholds: PixelThresholds = getPixelThresholds(viewport, axis);

        it('should scroll the window only if both the window and droppable can be scrolled', () => {
          const onMaxBoundary: Position = patch(
            axis.line,
            (viewport[axis.size] - thresholds.maxSpeedAt),
            viewport.center[axis.crossAxisLine],
          );

          autoScroller.onStateChange(
            state.idle,
            addDroppable(dragTo(onMaxBoundary), custom),
          );
          requestAnimationFrame.step();

          expect(mocks.scrollWindow).toHaveBeenCalled();
          expect(mocks.scrollDroppable).not.toHaveBeenCalled();
        });
      });

      describe('on drag end', () => {
        const endDragStates = [
          state.idle,
          state.dropAnimating(),
          state.userCancel(),
          state.dropComplete(),
        ];

        endDragStates.forEach((end: State) => {
          it('should cancel any pending window scroll', () => {
            const thresholds: PixelThresholds = getPixelThresholds(viewport, axis);
            const onMaxBoundary: Position = patch(
              axis.line,
              (viewport[axis.size] - thresholds.maxSpeedAt),
              viewport.center[axis.crossAxisLine],
            );

            autoScroller.onStateChange(state.idle, dragTo(onMaxBoundary));

            // frame not cleared
            expect(mocks.scrollWindow).not.toHaveBeenCalled();

            // should cancel the next frame
            autoScroller.onStateChange(dragTo(onMaxBoundary), end);
            requestAnimationFrame.flush();

            expect(mocks.scrollWindow).not.toHaveBeenCalled();
          });

          it('should cancel any pending droppable scroll', () => {
            const thresholds: PixelThresholds = getPixelThresholds(frame, axis);
            const onMaxBoundary: Position = patch(
              axis.line,
              (frame[axis.size] - thresholds.maxSpeedAt),
              frame.center[axis.crossAxisLine],
            );
            const drag: State = addDroppable(dragTo(onMaxBoundary), scrollable);

            autoScroller.onStateChange(
              state.idle,
              drag
            );

            // frame not cleared
            expect(mocks.scrollDroppable).not.toHaveBeenCalled();

            // should cancel the next frame
            autoScroller.onStateChange(drag, end);
            requestAnimationFrame.flush();

            expect(mocks.scrollDroppable).not.toHaveBeenCalled();
          });
        });
      });
    });
  });
});
