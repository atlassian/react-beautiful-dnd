// @flow
import type {
  Area,
  Axis,
  Position,
  State,
  DroppableDimension,
  Viewport,
} from '../../../../src/types';
import type { AutoScroller } from '../../../../src/state/auto-scroller/auto-scroller-types';
import { add, patch, subtract, negate } from '../../../../src/state/position';
import getArea from '../../../../src/state/get-area';
import { createViewport, withWindowScrollSize, scrollViewport } from '../../../utils/viewport';
import { vertical, horizontal } from '../../../../src/state/axis';
import createAutoScroller from '../../../../src/state/auto-scroller';
import getStatePreset from '../../../utils/get-simple-state-preset';
import { getPreset, addDroppable } from '../../../utils/dimension';
import { getDroppableDimension, scrollDroppable } from '../../../../src/state/dimension';
import getMaxScroll from '../../../../src/state/get-max-scroll';

const origin: Position = { x: 0, y: 0 };

const windowScrollSize = {
  scrollHeight: 2000,
  scrollWidth: 1600,
};
const scrollableViewport: Viewport = createViewport({
  subject: getArea({
    top: 0,
    left: 0,
    right: 800,
    bottom: 1000,
  }),
  scrollHeight: windowScrollSize.scrollHeight,
  scrollWidth: windowScrollSize.scrollWidth,
  scroll: origin,
});

const unscrollableViewport: Viewport = {
  subject: scrollableViewport.subject,
  scroll: origin,
  maxScroll: origin,
};

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
  });

  afterEach(() => {
    requestAnimationFrame.reset();
  });

  [vertical, horizontal].forEach((axis: Axis) => {
    describe(`on the ${axis.direction} axis`, () => {
      const preset = getPreset(axis);
      const state = getStatePreset(axis);

      describe('window scrolling', () => {
        describe('moving forwards', () => {
          it('should manually move the item if the window is unable to scroll', () => {
            const request: Position = patch(axis.line, 1);
            const current: State = state.scrollJumpRequest(request, unscrollableViewport);
            if (!current.drag) {
              throw new Error('invalid state');
            }
            const expected: Position = add(current.drag.current.client.selection, request);

            autoScroller.onStateChange(state.idle, current);

            expect(mocks.move).toHaveBeenCalledWith(
              preset.inHome1.descriptor.id,
              expected,
              unscrollableViewport,
              true,
            );
            expect(mocks.scrollWindow).not.toHaveBeenCalled();
          });

          it('should scroll the window if can absorb all of the movement', () => {
            const request: Position = patch(axis.line, 1);

            autoScroller.onStateChange(
              state.idle, state.scrollJumpRequest(request, scrollableViewport)
            );

            expect(mocks.scrollWindow).toHaveBeenCalledWith(request);
            expect(mocks.move).not.toHaveBeenCalled();
          });

          it('should manually move the item any distance that the window is unable to scroll', () => {
            // only allowing scrolling by 1 px
            const restricted: Viewport = withWindowScrollSize({
              viewport: scrollableViewport,
              scrollHeight: scrollableViewport.subject.height + 1,
              scrollWidth: scrollableViewport.subject.width + 1,
            });
            // more than the 1 pixel allowed
            const request: Position = patch(axis.line, 3);
            const current: State = state.scrollJumpRequest(request, restricted);
            if (!current.drag) {
              throw new Error('invalid state');
            }
            const expected: Position = add(
              current.drag.current.client.selection,
              // the two pixels that could not be done by the window
              patch(axis.line, 2)
            );

            autoScroller.onStateChange(state.idle, state.scrollJumpRequest(request, restricted));

            // can scroll with what we have
            expect(mocks.scrollWindow).toHaveBeenCalledWith(patch(axis.line, 1));
            // remainder to be done by movement
            expect(mocks.move).toHaveBeenCalledWith(
              preset.inHome1.descriptor.id,
              expected,
              restricted,
              true,
            );
          });
        });

        describe('moving backwards', () => {
          it('should manually move the item if the window is unable to scroll', () => {
            // unable to scroll backwards to start with
            const request: Position = patch(axis.line, -1);
            const current: State = state.scrollJumpRequest(request, unscrollableViewport);
            if (!current.drag) {
              throw new Error('invalid state');
            }
            const expected: Position = add(current.drag.current.client.selection, request);

            autoScroller.onStateChange(state.idle, current);

            expect(mocks.move).toHaveBeenCalledWith(
              preset.inHome1.descriptor.id,
              expected,
              unscrollableViewport,
              true,
            );
            expect(mocks.scrollWindow).not.toHaveBeenCalled();
          });

          it('should scroll the window if can absorb all of the movement', () => {
            const scrolled: Viewport = scrollViewport(scrollableViewport, patch(axis.line, 1));
            const request: Position = patch(axis.line, -1);

            autoScroller.onStateChange(
              state.idle,
              state.scrollJumpRequest(request, scrolled)
            );

            expect(mocks.scrollWindow).toHaveBeenCalledWith(request);
            expect(mocks.move).not.toHaveBeenCalled();
          });

          it('should manually move the item any distance that the window is unable to scroll', () => {
            // only allowing scrolling by 1 px
            const windowScroll: Position = patch(axis.line, 1);
            const scrolled: Viewport = scrollViewport(scrollableViewport, windowScroll);
            // more than the 1 pixel allowed
            const request: Position = patch(axis.line, -3);
            const current: State = state.scrollJumpRequest(request, scrolled);
            if (!current.drag) {
              throw new Error('invalid state');
            }
            const expected: Position = add(
              current.drag.current.client.selection,
              // the two pixels that could not be done by the window
              patch(axis.line, -2)
            );

            autoScroller.onStateChange(state.idle, current);

            // can scroll with what we have
            expect(mocks.scrollWindow).toHaveBeenCalledWith(patch(axis.line, -1));
            // remainder to be done by movement
            expect(mocks.move).toHaveBeenCalledWith(
              preset.inHome1.descriptor.id,
              expected,
              scrolled,
              true,
            );
          });
        });
      });

      describe('droppable scrolling (which can involve some window scrolling)', () => {
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
          // stealing the home descriptor so that the dragging item will
          // be within in
          descriptor: preset.home.descriptor,
          borderBox: getArea({
            top: 0,
            left: 0,
            // bigger than the frame
            right: scrollableScrollSize.scrollWidth,
            bottom: scrollableScrollSize.scrollHeight,
          }),
          closest: {
            frameBorderBox: frame,
            scrollWidth: scrollableScrollSize.scrollWidth,
            scrollHeight: scrollableScrollSize.scrollHeight,
            scroll: { x: 0, y: 0 },
            shouldClipSubject: true,
          },
        });

        if (!scrollable.viewport.closestScrollable) {
          throw new Error('Invalid droppable');
        }

        const maxDroppableScroll: Position =
          scrollable.viewport.closestScrollable.scroll.max;

        describe('moving forwards', () => {
          describe('droppable is able to complete entire scroll', () => {
            it('should only scroll the droppable', () => {
              const request: Position = patch(axis.line, 1);

              autoScroller.onStateChange(
                state.idle,
                addDroppable(state.scrollJumpRequest(request, unscrollableViewport), scrollable),
              );

              expect(mocks.scrollDroppable).toHaveBeenCalledWith(
                scrollable.descriptor.id,
                request,
              );
              expect(mocks.scrollWindow).not.toHaveBeenCalled();
              expect(mocks.move).not.toHaveBeenCalled();
            });
          });

          describe('droppable is unable to complete the entire scroll', () => {
            it('should manually move the entire request if it is unable to be partially completed by the window or the droppable', () => {
              // droppable can no longer be scrolled
              const scrolled: DroppableDimension = scrollDroppable(
                scrollable,
                maxDroppableScroll,
              );
              const request: Position = patch(axis.line, 1);
              const current: State = state.scrollJumpRequest(request, unscrollableViewport);
              if (!current.drag) {
                throw new Error('invalid state');
              }
              const expected: Position = add(current.drag.current.client.selection, request);

              autoScroller.onStateChange(
                state.idle,
                addDroppable(current, scrolled),
              );

              expect(mocks.scrollWindow).not.toHaveBeenCalled();
              expect(mocks.scrollDroppable).not.toHaveBeenCalled();
              expect(mocks.move).toHaveBeenCalledWith(
                preset.inHome1.descriptor.id,
                expected,
                unscrollableViewport,
                true,
              );
            });

            describe('window is unable to absorb some of the scroll', () => {
              it('should scroll the droppable what it can and move the rest', () => {
                // able to scroll 1 pixel forward
                const availableScroll: Position = patch(axis.line, 1);
                const scroll: Position = subtract(maxDroppableScroll, availableScroll);
                const scrolled: DroppableDimension = scrollDroppable(
                  scrollable,
                  scroll,
                );
                // want to move 3 pixels
                const request: Position = patch(axis.line, 3);
                const current: State = state.scrollJumpRequest(request, unscrollableViewport);
                if (!current.drag) {
                  throw new Error('invalid state');
                }
                const expectedManualMove: Position =
                  add(current.drag.current.client.selection, patch(axis.line, 2));

                autoScroller.onStateChange(
                  state.idle,
                  addDroppable(current, scrolled),
                );

                expect(mocks.scrollWindow).not.toHaveBeenCalled();
                expect(mocks.scrollDroppable).toHaveBeenCalledWith(
                  preset.home.descriptor.id,
                  availableScroll,
                );
                expect(mocks.move).toHaveBeenCalledWith(
                  preset.inHome1.descriptor.id,
                  expectedManualMove,
                  unscrollableViewport,
                  true,
                );
              });
            });

            describe('window can absorb some of the scroll', () => {
              it('should scroll the entire overlap if it can', () => {
                const availableScroll: Position = patch(axis.line, 1);
                const scroll: Position = subtract(maxDroppableScroll, availableScroll);
                const scrolled: DroppableDimension = scrollDroppable(
                  scrollable,
                  scroll,
                );
                // want to move 3 pixels
                const request: Position = patch(axis.line, 3);

                autoScroller.onStateChange(
                  state.idle,
                  addDroppable(state.scrollJumpRequest(request, scrollableViewport), scrolled),
                );

                expect(mocks.scrollDroppable).toHaveBeenCalledWith(
                  scrolled.descriptor.id,
                  availableScroll,
                );
                expect(mocks.scrollWindow).toHaveBeenCalledWith(patch(axis.line, 2));
                expect(mocks.move).not.toHaveBeenCalled();
              });

              it('should scroll the droppable and window by what it can, and manually move the rest', () => {
                // Setting the window scroll so it has a small amount of available space
                const availableWindowScroll: Position = patch(axis.line, 2);
                const maxWindowScroll: Position = getMaxScroll({
                  scrollHeight: windowScrollSize.scrollHeight,
                  scrollWidth: windowScrollSize.scrollWidth,
                  height: scrollableViewport.subject.height,
                  width: scrollableViewport.subject.width,
                });
                const windowScroll: Position = subtract(maxWindowScroll, availableWindowScroll);
                // setWindowScroll(windowScroll);
                const scrolledViewport: Viewport = scrollViewport(scrollableViewport, windowScroll);
                // Setting the droppable scroll so it has a small amount of available space
                const availableDroppableScroll: Position = patch(axis.line, 1);
                const droppableScroll: Position = subtract(
                  maxDroppableScroll,
                  availableDroppableScroll
                );
                const scrolled: DroppableDimension = scrollDroppable(
                  scrollable,
                  droppableScroll,
                );
                // How much we want to scroll
                const request: Position = patch(axis.line, 5);
                // How much we will not be able to absorb with droppable and window scroll
                const remainder: Position =
                  subtract(subtract(request, availableDroppableScroll), availableWindowScroll);
                const current = addDroppable(
                  state.scrollJumpRequest(request, scrolledViewport),
                  scrolled
                );
                if (!current.drag) {
                  throw new Error('invalid state');
                }
                const expectedManualMove: Position =
                  add(current.drag.current.client.selection, remainder);

                autoScroller.onStateChange(state.idle, current);

                expect(mocks.scrollDroppable).toHaveBeenCalledWith(
                  scrolled.descriptor.id,
                  availableDroppableScroll,
                );
                expect(mocks.scrollWindow).toHaveBeenCalledWith(availableWindowScroll);
                expect(mocks.move).toHaveBeenCalledWith(
                  preset.inHome1.descriptor.id,
                  expectedManualMove,
                  scrolledViewport,
                  true,
                );
              });
            });
          });
        });

        describe('moving backwards', () => {
          describe('droppable is able to complete entire scroll', () => {
            it('should only scroll the droppable', () => {
              // move forward slightly to allow us to move forwards
              const scrolled: DroppableDimension = scrollDroppable(scrollable, patch(axis.line, 1));
              const request: Position = patch(axis.line, -1);

              autoScroller.onStateChange(
                state.idle,
                addDroppable(state.scrollJumpRequest(request, scrollableViewport), scrolled),
              );

              expect(mocks.scrollDroppable).toHaveBeenCalledWith(
                scrolled.descriptor.id,
                request,
              );
              expect(mocks.scrollWindow).not.toHaveBeenCalled();
              expect(mocks.move).not.toHaveBeenCalled();
            });
          });

          describe('droppable is unable to complete the entire scroll', () => {
            it('should manually move the entire request if it is unable to be partially completed by the window or the droppable', () => {
              const request: Position = patch(axis.line, -1);
              const current: State = state.scrollJumpRequest(request, unscrollableViewport);
              if (!current.drag) {
                throw new Error('invalid state');
              }
              const expected: Position = add(current.drag.current.client.selection, request);

              autoScroller.onStateChange(
                state.idle,
                addDroppable(current, scrollable),
              );

              expect(mocks.scrollWindow).not.toHaveBeenCalled();
              expect(mocks.scrollDroppable).not.toHaveBeenCalled();
              expect(mocks.move).toHaveBeenCalledWith(
                preset.inHome1.descriptor.id,
                expected,
                unscrollableViewport,
                true,
              );
            });

            describe('window is unable to absorb some of the scroll', () => {
              it('should scroll the droppable what it can and move the rest', () => {
                // able to scroll 1 pixel forward
                const scrolled: DroppableDimension = scrollDroppable(
                  scrollable,
                  patch(axis.line, 1),
                );
                // want to move backwards 3 pixels
                const request: Position = patch(axis.line, -3);
                const current: State = state.scrollJumpRequest(request, unscrollableViewport);
                if (!current.drag) {
                  throw new Error('invalid state');
                }
                // manual move will take what the droppable cannot
                const expectedManualMove: Position =
                  add(current.drag.current.client.selection, patch(axis.line, -2));

                autoScroller.onStateChange(
                  state.idle,
                  addDroppable(current, scrolled),
                );

                expect(mocks.scrollWindow).not.toHaveBeenCalled();
                expect(mocks.scrollDroppable).toHaveBeenCalledWith(
                  preset.home.descriptor.id,
                  // can only scroll backwards what it has!
                  patch(axis.line, -1),
                );
                expect(mocks.move).toHaveBeenCalledWith(
                  preset.inHome1.descriptor.id,
                  expectedManualMove,
                  unscrollableViewport,
                  true,
                );
              });
            });

            describe('window can absorb some of the scroll', () => {
              it('should scroll the entire overlap if it can', () => {
                // let the window scroll be enough to move back into
                const scrolledViewport: Viewport = scrollViewport(
                  scrollableViewport, patch(axis.line, 100)
                );
                const scrolledDroppable: DroppableDimension = scrollDroppable(
                  scrollable,
                  patch(axis.line, 1),
                );
                // want to move 3 pixels backwards
                const request: Position = patch(axis.line, -3);

                autoScroller.onStateChange(
                  state.idle,
                  addDroppable(
                    state.scrollJumpRequest(request, scrolledViewport),
                    scrolledDroppable
                  ),
                );

                expect(mocks.scrollDroppable).toHaveBeenCalledWith(
                  scrolledDroppable.descriptor.id,
                  patch(axis.line, -1),
                );
                expect(mocks.scrollWindow).toHaveBeenCalledWith(patch(axis.line, -2));
                expect(mocks.move).not.toHaveBeenCalled();
              });

              it('should scroll the droppable and window by what it can, and manually move the rest', () => {
                // Setting the window scroll so it has a small amount of available space
                const windowScroll: Position = patch(axis.line, 2);
                const scrolledViewport: Viewport = scrollViewport(scrollableViewport, windowScroll);
                // Setting the droppable scroll so it has a small amount of available space
                const droppableScroll: Position = patch(axis.line, 1);
                const scrolled: DroppableDimension = scrollDroppable(
                  scrollable,
                  droppableScroll,
                );
                // How much we want to scroll
                const request: Position = patch(axis.line, -5);
                // How much we will not be able to absorb with droppable and window scroll
                const remainder: Position = patch(axis.line, -2);
                const current = addDroppable(
                  state.scrollJumpRequest(request, scrolledViewport),
                  scrolled
                );
                if (!current.drag) {
                  throw new Error('invalid state');
                }
                const expectedManualMove: Position =
                  add(current.drag.current.client.selection, remainder);

                autoScroller.onStateChange(state.idle, current);

                expect(mocks.scrollDroppable).toHaveBeenCalledWith(
                  scrolled.descriptor.id,
                  negate(droppableScroll),
                );
                expect(mocks.scrollWindow).toHaveBeenCalledWith(negate(windowScroll));
                expect(mocks.move).toHaveBeenCalledWith(
                  preset.inHome1.descriptor.id,
                  expectedManualMove,
                  scrolledViewport,
                  true,
                );
              });
            });
          });
        });
      });
    });
  });
});
