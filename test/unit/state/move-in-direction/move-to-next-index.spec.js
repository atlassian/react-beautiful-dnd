// @flow
import { getRect, type Position } from 'css-box-model';
import moveToNextIndex from '../../../../src/state/move-in-direction/move-to-next-index';
import type { Result } from '../../../../src/state/move-in-direction/move-to-next-index/move-to-next-index-types';
import { scrollDroppable } from '../../../../src/state/droppable-dimension';
import {
  getPreset,
  disableDroppable,
  getClosestScrollable,
  getDroppableDimension,
  getDraggableDimension,
} from '../../../utils/dimension';
import moveToEdge from '../../../../src/state/move-to-edge';
import noImpact, { noMovement } from '../../../../src/state/no-impact';
import { patch, subtract } from '../../../../src/state/position';
import { vertical, horizontal } from '../../../../src/state/axis';
import { isPartiallyVisible } from '../../../../src/state/visibility/is-visible';
import { createViewport } from '../../../utils/viewport';
import type {
  Viewport,
  Axis,
  DragImpact,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimension,
  DraggableLocation,
} from '../../../../src/types';

const origin: Position = { x: 0, y: 0 };

const customViewport: Viewport = createViewport({
  frame: getRect({
    top: 0,
    left: 0,
    bottom: 1000,
    right: 1000,
  }),
  scroll: origin,
  scrollHeight: 1000,
  scrollWidth: 1000,
});

describe('move to next index', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  [vertical, horizontal].forEach((axis: Axis) => {
    describe(`on the ${axis.direction} axis`, () => {
      const preset = getPreset(axis);

      it('should return null if the droppable is disabled', () => {
        const disabled: DroppableDimension = disableDroppable(preset.home);

        const result: ?Result = moveToNextIndex({
          isMovingForward: true,
          draggableId: preset.inHome1.descriptor.id,
          previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
          previousImpact: noImpact,
          droppable: disabled,
          draggables: preset.draggables,
          viewport: customViewport,
        });

        expect(result).toEqual(null);
      });

      describe('in home list', () => {
        describe('moving forwards', () => {
          it('should return null if cannot move forward', () => {
            const previousImpact: DragImpact = {
              // not filling in movement correctly
              movement: noMovement,
              direction: axis.direction,
              // already in the last position
              destination: {
                index: preset.inHomeList.length - 1,
                droppableId: preset.home.descriptor.id,
              },
            };

            const result: ?Result = moveToNextIndex({
              isMovingForward: true,
              draggableId: preset.inHome3.descriptor.id,
              previousImpact,
              previousPageBorderBoxCenter: preset.inHome3.page.borderBox.center,
              droppable: preset.home,
              draggables: preset.draggables,
              viewport: customViewport,
            });

            expect(result).toBe(null);
          });

          describe('is moving away from start position', () => {
            describe('dragging first item forward one position', () => {
              // dragging the first item forward into the second position
              const destination: DraggableLocation = {
                index: preset.inHome1.descriptor.index,
                droppableId: preset.home.descriptor.id,
              };
              const previousImpact: DragImpact = {
                movement: noMovement,
                direction: axis.direction,
                destination,
              };
              const result: ?Result = moveToNextIndex({
                isMovingForward: true,
                draggableId: preset.inHome1.descriptor.id,
                previousImpact,
                previousPageBorderBoxCenter:
                  preset.inHome1.page.borderBox.center,
                draggables: preset.draggables,
                droppable: preset.home,
                viewport: customViewport,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the end of the dragging item to the end of the next item', () => {
                const expected: Position = moveToEdge({
                  source: preset.inHome1.page.borderBox,
                  sourceEdge: 'end',
                  destination: preset.inHome2.page.borderBox,
                  destinationEdge: 'end',
                  destinationAxis: axis,
                });

                expect(result.pageBorderBoxCenter).toEqual(expected);
              });

              it('should move the item into the second spot and move the second item out of the way', () => {
                const expected: DragImpact = {
                  movement: {
                    displaced: [
                      {
                        draggableId: preset.inHome2.descriptor.id,
                        isVisible: true,
                        shouldAnimate: true,
                      },
                    ],
                    amount: patch(
                      axis.line,
                      preset.inHome1.page.marginBox[axis.size],
                    ),
                    isBeyondStartPosition: true,
                  },
                  direction: axis.direction,
                  // is now in the second position
                  destination: {
                    droppableId: preset.home.descriptor.id,
                    index: 1,
                  },
                };

                expect(result.impact).toEqual(expected);
              });
            });

            describe('dragging second item forward one position', () => {
              const destination: DraggableLocation = {
                index: preset.inHome2.descriptor.index,
                droppableId: preset.home.descriptor.id,
              };
              const previousImpact: DragImpact = {
                movement: noMovement,
                direction: axis.direction,
                destination,
              };
              const result: ?Result = moveToNextIndex({
                isMovingForward: true,
                draggableId: preset.inHome2.descriptor.id,
                previousImpact,
                previousPageBorderBoxCenter:
                  preset.inHome2.page.borderBox.center,
                draggables: preset.draggables,
                droppable: preset.home,
                viewport: customViewport,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the end of the dragging item to the end of the next item', () => {
                const expected: Position = moveToEdge({
                  source: preset.inHome2.page.borderBox,
                  sourceEdge: 'end',
                  destination: preset.inHome3.page.borderBox,
                  destinationEdge: 'end',
                  destinationAxis: axis,
                });

                expect(result.pageBorderBoxCenter).toEqual(expected);
              });

              it('should move the dragging item into the third spot and move the third item out of the way', () => {
                const expected: DragImpact = {
                  movement: {
                    displaced: [
                      {
                        draggableId: preset.inHome3.descriptor.id,
                        isVisible: true,
                        shouldAnimate: true,
                      },
                    ],
                    amount: patch(
                      axis.line,
                      preset.inHome2.page.marginBox[axis.size],
                    ),
                    isBeyondStartPosition: true,
                  },
                  direction: axis.direction,
                  // is now in the second position
                  destination: {
                    droppableId: preset.home.descriptor.id,
                    index: preset.inHome2.descriptor.index + 1,
                  },
                };

                expect(result.impact).toEqual(expected);
              });
            });

            describe('dragging first item forward one position after already moving it forward once', () => {
              const previousImpact: DragImpact = {
                movement: {
                  // second item has already moved
                  displaced: [
                    {
                      draggableId: preset.inHome2.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
                  ],
                  amount: patch(
                    axis.line,
                    preset.inHome1.page.marginBox[axis.size],
                  ),
                  isBeyondStartPosition: true,
                },
                direction: axis.direction,
                // draggable1 is now in the second position
                destination: {
                  droppableId: preset.home.descriptor.id,
                  index: 1,
                },
              };

              const result: ?Result = moveToNextIndex({
                isMovingForward: true,
                draggableId: preset.inHome1.descriptor.id,
                previousImpact,
                // roughly correct previous page center
                // not calculating the exact point as it is not required for this test
                previousPageBorderBoxCenter:
                  preset.inHome2.page.borderBox.center,
                draggables: preset.draggables,
                droppable: preset.home,
                viewport: customViewport,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the end of the dragging item to the end of the next item', () => {
                // next dimension from the current index is draggable3
                const expected: Position = moveToEdge({
                  source: preset.inHome1.page.borderBox,
                  sourceEdge: 'end',
                  destination: preset.inHome3.page.borderBox,
                  destinationEdge: 'end',
                  destinationAxis: axis,
                });

                expect(result.pageBorderBoxCenter).toEqual(expected);
              });

              it('should move the third item out of the way', () => {
                const expected: DragImpact = {
                  movement: {
                    // adding draggable3 to the list
                    // list is sorted by the the closest to the current item
                    displaced: [
                      {
                        draggableId: preset.inHome3.descriptor.id,
                        isVisible: true,
                        shouldAnimate: true,
                      },
                      {
                        draggableId: preset.inHome2.descriptor.id,
                        isVisible: true,
                        shouldAnimate: true,
                      },
                    ],
                    amount: patch(
                      axis.line,
                      preset.inHome1.page.marginBox[axis.size],
                    ),
                    isBeyondStartPosition: true,
                  },
                  direction: axis.direction,
                  // is now in the second position
                  destination: {
                    droppableId: preset.home.descriptor.id,
                    index: 2,
                  },
                };

                expect(result.impact).toEqual(expected);
              });
            });
          });

          describe('is moving toward start position', () => {
            describe('dragging item forward to starting position', () => {
              // dragging the second item (draggable2), which has previously
              // been moved backwards and is now in the first position
              const previousImpact: DragImpact = {
                movement: {
                  displaced: [
                    {
                      draggableId: preset.inHome1.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
                  ],
                  amount: patch(
                    axis.line,
                    preset.inHome2.page.marginBox[axis.size],
                  ),
                  isBeyondStartPosition: false,
                },
                direction: axis.direction,
                destination: {
                  index: 0,
                  droppableId: preset.home.descriptor.id,
                },
              };
              const result: ?Result = moveToNextIndex({
                isMovingForward: true,
                draggableId: preset.inHome2.descriptor.id,
                previousImpact,
                // roughly correct:
                previousPageBorderBoxCenter:
                  preset.inHome1.page.borderBox.center,
                draggables: preset.draggables,
                viewport: customViewport,
                droppable: preset.home,
              });

              if (!result) {
                throw new Error('invalid result of moveToNextIndex');
              }

              it('should move the start of the dragging item to the end of the previous item (which its original position)', () => {
                const expected: Position = moveToEdge({
                  source: preset.inHome2.page.borderBox,
                  sourceEdge: 'start',
                  destination: preset.inHome2.page.borderBox,
                  destinationEdge: 'start',
                  destinationAxis: axis,
                });

                expect(result.pageBorderBoxCenter).toEqual(expected);
                // is now back at its original position
                expect(result.pageBorderBoxCenter).toEqual(
                  preset.inHome2.page.borderBox.center,
                );
              });

              it('should return an empty impact', () => {
                const expected: DragImpact = {
                  movement: {
                    displaced: [],
                    amount: patch(
                      axis.line,
                      preset.inHome2.page.marginBox[axis.size],
                    ),
                    isBeyondStartPosition: false,
                  },
                  destination: {
                    droppableId: preset.home.descriptor.id,
                    index: 1,
                  },
                  direction: axis.direction,
                };

                expect(result.impact).toEqual(expected);
              });
            });

            describe('dragging forwards, but not beyond the starting position', () => {
              // draggable3 has moved backwards past draggable2 and draggable1
              const previousImpact: DragImpact = {
                movement: {
                  // second and first item have already moved
                  // sorted by the draggable that is closest to where the dragging item is
                  displaced: [
                    {
                      draggableId: preset.inHome1.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
                    {
                      draggableId: preset.inHome2.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
                  ],
                  amount: patch(
                    axis.line,
                    preset.inHome3.page.marginBox[axis.size],
                  ),
                  isBeyondStartPosition: true,
                },
                direction: axis.direction,
                // draggable3 is now in the first position
                destination: {
                  droppableId: preset.home.descriptor.id,
                  index: 0,
                },
              };
              // moving draggable3 forward one position
              const result: ?Result = moveToNextIndex({
                isMovingForward: true,
                draggableId: preset.inHome3.descriptor.id,
                previousImpact,
                // this is roughly correct
                previousPageBorderBoxCenter:
                  preset.inHome1.page.borderBox.center,
                draggables: preset.draggables,
                viewport: customViewport,
                droppable: preset.home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move to the start of the draggable item to the start position of the destination draggable', () => {
                const expected: Position = moveToEdge({
                  source: preset.inHome3.page.borderBox,
                  sourceEdge: 'start',
                  destination: preset.inHome2.page.borderBox,
                  destinationEdge: 'start',
                  destinationAxis: axis,
                });

                expect(result.pageBorderBoxCenter).toEqual(expected);
              });

              it('should remove the first dimension from the impact', () => {
                const expected: DragImpact = {
                  movement: {
                    displaced: [
                      {
                        draggableId: preset.inHome2.descriptor.id,
                        isVisible: true,
                        shouldAnimate: true,
                      },
                    ],
                    amount: patch(
                      axis.line,
                      preset.inHome3.page.marginBox[axis.size],
                    ),
                    // is still behind where it started
                    isBeyondStartPosition: false,
                  },
                  direction: axis.direction,
                  // is now in the second position
                  destination: {
                    droppableId: preset.home.descriptor.id,
                    index: 1,
                  },
                };

                expect(result.impact).toEqual(expected);
              });
            });

            describe('forced visibility displacement', () => {
              const crossAxisStart: number = 0;
              const crossAxisEnd: number = 100;

              const droppableScrollSize = {
                scrollHeight: axis === vertical ? 400 : crossAxisEnd,
                scrollWidth: axis === horizontal ? 400 : crossAxisEnd,
              };

              const home: DroppableDimension = getDroppableDimension({
                descriptor: {
                  id: 'home',
                  type: 'TYPE',
                },
                direction: axis.direction,
                borderBox: {
                  [axis.crossAxisStart]: crossAxisStart,
                  [axis.crossAxisEnd]: crossAxisEnd,
                  [axis.start]: 0,
                  [axis.end]: 400,
                },
                closest: {
                  borderBox: {
                    [axis.crossAxisStart]: crossAxisStart,
                    [axis.crossAxisEnd]: crossAxisEnd,
                    [axis.start]: 0,
                    // will cut off the subject
                    [axis.end]: 100,
                  },
                  scrollHeight: droppableScrollSize.scrollHeight,
                  scrollWidth: droppableScrollSize.scrollWidth,
                  shouldClipSubject: true,
                  scroll: { x: 0, y: 0 },
                },
              });

              const maxScroll: Position = getClosestScrollable(home).scroll.max;

              // half the size of the viewport
              const inHome1: DraggableDimension = getDraggableDimension({
                descriptor: {
                  id: 'inHome1',
                  droppableId: home.descriptor.id,
                  type: home.descriptor.type,
                  index: 0,
                },
                borderBox: {
                  [axis.crossAxisStart]: crossAxisStart,
                  [axis.crossAxisEnd]: crossAxisEnd,
                  [axis.start]: 0,
                  [axis.end]: 50,
                },
              });

              const inHome2: DraggableDimension = getDraggableDimension({
                descriptor: {
                  id: 'inHome2',
                  droppableId: home.descriptor.id,
                  type: home.descriptor.type,
                  index: 1,
                },
                borderBox: {
                  [axis.crossAxisStart]: crossAxisStart,
                  [axis.crossAxisEnd]: crossAxisEnd,
                  [axis.start]: 50,
                  [axis.end]: 100,
                },
              });

              const inHome3: DraggableDimension = getDraggableDimension({
                descriptor: {
                  id: 'inHome3',
                  droppableId: home.descriptor.id,
                  type: home.descriptor.type,
                  index: 2,
                },
                borderBox: {
                  [axis.crossAxisStart]: crossAxisStart,
                  [axis.crossAxisEnd]: crossAxisEnd,
                  [axis.start]: 100,
                  [axis.end]: 150,
                },
              });

              const inHome4: DraggableDimension = getDraggableDimension({
                descriptor: {
                  id: 'inHome4',
                  droppableId: home.descriptor.id,
                  type: home.descriptor.type,
                  index: 3,
                },
                borderBox: {
                  [axis.crossAxisStart]: crossAxisStart,
                  [axis.crossAxisEnd]: crossAxisEnd,
                  [axis.start]: 200,
                  [axis.end]: 250,
                },
              });

              const inHome5: DraggableDimension = getDraggableDimension({
                descriptor: {
                  id: 'inHome5',
                  droppableId: home.descriptor.id,
                  type: home.descriptor.type,
                  index: 4,
                },
                borderBox: {
                  [axis.crossAxisStart]: crossAxisStart,
                  [axis.crossAxisEnd]: crossAxisEnd,
                  [axis.start]: 300,
                  [axis.end]: 350,
                },
              });

              const inHome6: DraggableDimension = getDraggableDimension({
                descriptor: {
                  id: 'inHome5',
                  droppableId: home.descriptor.id,
                  type: home.descriptor.type,
                  index: 5,
                },
                borderBox: {
                  [axis.crossAxisStart]: crossAxisStart,
                  [axis.crossAxisEnd]: crossAxisEnd,
                  [axis.start]: 350,
                  [axis.end]: 400,
                },
              });

              const draggables: DraggableDimensionMap = {
                [inHome1.descriptor.id]: inHome1,
                [inHome2.descriptor.id]: inHome2,
                [inHome3.descriptor.id]: inHome3,
                [inHome4.descriptor.id]: inHome4,
                [inHome5.descriptor.id]: inHome5,
                [inHome6.descriptor.id]: inHome6,
              };

              it('should force the displacement of the items up to the size of the item dragging and the item no longer being displaced', () => {
                // We have moved inHome1 to the end of the list
                const previousImpact: DragImpact = {
                  movement: {
                    // ordered by most recently impacted
                    displaced: [
                      // the last impact would have been before the last addition.
                      // At this point the last two items would have been visible
                      {
                        draggableId: inHome6.descriptor.id,
                        isVisible: true,
                        shouldAnimate: true,
                      },
                      {
                        draggableId: inHome5.descriptor.id,
                        isVisible: true,
                        shouldAnimate: true,
                      },
                      {
                        draggableId: inHome4.descriptor.id,
                        isVisible: false,
                        shouldAnimate: false,
                      },
                      {
                        draggableId: inHome3.descriptor.id,
                        isVisible: false,
                        shouldAnimate: false,
                      },
                      {
                        draggableId: inHome2.descriptor.id,
                        isVisible: false,
                        shouldAnimate: false,
                      },
                    ],
                    amount: patch(axis.line, inHome1.page.marginBox[axis.size]),
                    isBeyondStartPosition: true,
                  },
                  direction: axis.direction,
                  // is now in the last position
                  destination: {
                    droppableId: home.descriptor.id,
                    index: 4,
                  },
                };
                // home has now scrolled to the bottom
                const scrolled: DroppableDimension = scrollDroppable(
                  home,
                  maxScroll,
                );

                // validation of previous impact
                expect(
                  isPartiallyVisible({
                    target: inHome6.page.marginBox,
                    destination: scrolled,
                    viewport: customViewport.frame,
                  }),
                ).toBe(true);
                expect(
                  isPartiallyVisible({
                    target: inHome5.page.marginBox,
                    destination: scrolled,
                    viewport: customViewport.frame,
                  }),
                ).toBe(true);
                expect(
                  isPartiallyVisible({
                    target: inHome4.page.marginBox,
                    destination: scrolled,
                    viewport: customViewport.frame,
                  }),
                ).toBe(false);
                expect(
                  isPartiallyVisible({
                    target: inHome3.page.marginBox,
                    destination: scrolled,
                    viewport: customViewport.frame,
                  }),
                ).toBe(false);
                // this one will remain invisible
                expect(
                  isPartiallyVisible({
                    target: inHome2.page.marginBox,
                    destination: scrolled,
                    viewport: customViewport.frame,
                  }),
                ).toBe(false);

                const expected: DragImpact = {
                  movement: {
                    // ordered by most recently impacted
                    displaced: [
                      // shouldAnimate has not changed to false - using previous impact
                      {
                        draggableId: inHome5.descriptor.id,
                        isVisible: true,
                        shouldAnimate: true,
                      },
                      // was not visibile - now forcing to be visible
                      // (within the size of the dragging item (50px) and the moving item (50px))
                      {
                        draggableId: inHome4.descriptor.id,
                        isVisible: true,
                        shouldAnimate: false,
                      },
                      // was not visibile - now forcing to be visible
                      // (within the size of the dragging item (50px) and the moving item (50px))
                      {
                        draggableId: inHome3.descriptor.id,
                        isVisible: true,
                        shouldAnimate: false,
                      },
                      // still not visible
                      // not within the 100px buffer
                      {
                        draggableId: inHome2.descriptor.id,
                        isVisible: false,
                        shouldAnimate: false,
                      },
                    ],
                    amount: patch(axis.line, inHome1.page.marginBox[axis.size]),
                    isBeyondStartPosition: true,
                  },
                  direction: axis.direction,
                  // is now in the second last position
                  destination: {
                    droppableId: home.descriptor.id,
                    index: 3,
                  },
                };

                const result: ?Result = moveToNextIndex({
                  isMovingForward: false,
                  draggableId: inHome1.descriptor.id,
                  previousImpact,
                  // roughly correct:
                  previousPageBorderBoxCenter: inHome1.page.borderBox.center,
                  draggables,
                  viewport: customViewport,
                  droppable: scrolled,
                });

                if (!result) {
                  throw new Error('Invalid test setup');
                }

                expect(result.impact).toEqual(expected);
              });
            });
          });
        });

        describe('moving backwards', () => {
          it('should return null if cannot move backward', () => {
            const previousImpact: DragImpact = {
              movement: {
                displaced: [],
                amount: patch(
                  axis.line,
                  preset.inHome1.page.marginBox[axis.size],
                ),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                index: 0,
                droppableId: preset.home.descriptor.id,
              },
            };

            const result: ?Result = moveToNextIndex({
              isMovingForward: false,
              draggableId: preset.inHome1.descriptor.id,
              previousImpact,
              previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
              draggables: preset.draggables,
              droppable: preset.home,
              viewport: customViewport,
            });

            expect(result).toBe(null);
          });

          describe('is moving away from start position', () => {
            describe('dragging the second item back to the first position', () => {
              // no impact yet
              const previousImpact: DragImpact = {
                movement: {
                  displaced: [],
                  amount: patch(
                    axis.line,
                    preset.inHome2.page.marginBox[axis.size],
                  ),
                  isBeyondStartPosition: false,
                },
                destination: {
                  droppableId: preset.home.descriptor.id,
                  index: 1,
                },
                direction: axis.direction,
              };
              const result: ?Result = moveToNextIndex({
                isMovingForward: false,
                draggableId: preset.inHome2.descriptor.id,
                previousImpact,
                previousPageBorderBoxCenter:
                  preset.inHome2.page.borderBox.center,
                draggables: preset.draggables,
                droppable: preset.home,
                viewport: customViewport,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the start of the draggable to the start of the previous draggable', () => {
                const expected: Position = moveToEdge({
                  source: preset.inHome2.page.borderBox,
                  sourceEdge: 'start',
                  destination: preset.inHome1.page.borderBox,
                  destinationEdge: 'start',
                  destinationAxis: axis,
                });

                expect(result.pageBorderBoxCenter).toEqual(expected);
              });

              it('should add the first draggable to the drag impact', () => {
                const expected: DragImpact = {
                  movement: {
                    displaced: [
                      {
                        draggableId: preset.inHome1.descriptor.id,
                        isVisible: true,
                        shouldAnimate: true,
                      },
                    ],
                    amount: patch(
                      axis.line,
                      preset.inHome2.page.marginBox[axis.size],
                    ),
                    isBeyondStartPosition: false,
                  },
                  destination: {
                    droppableId: preset.home.descriptor.id,
                    // is now in the first position
                    index: 0,
                  },
                  direction: axis.direction,
                };

                expect(result.impact).toEqual(expected);
              });
            });

            describe('dragging the third item back to the second position', () => {
              const previousImpact: DragImpact = {
                movement: {
                  displaced: [],
                  amount: patch(
                    axis.line,
                    preset.inHome3.page.marginBox[axis.size],
                  ),
                  isBeyondStartPosition: false,
                },
                destination: {
                  droppableId: preset.home.descriptor.id,
                  index: 2,
                },
                direction: axis.direction,
              };
              const result: ?Result = moveToNextIndex({
                isMovingForward: false,
                draggableId: preset.inHome3.descriptor.id,
                previousImpact,
                previousPageBorderBoxCenter:
                  preset.inHome3.page.borderBox.center,
                draggables: preset.draggables,
                droppable: preset.home,
                viewport: customViewport,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the start of the draggable to the start of the previous draggable', () => {
                const expected: Position = moveToEdge({
                  source: preset.inHome3.page.borderBox,
                  sourceEdge: 'start',
                  destination: preset.inHome2.page.borderBox,
                  destinationEdge: 'start',
                  destinationAxis: axis,
                });

                expect(result.pageBorderBoxCenter).toEqual(expected);
              });

              it('should add the second draggable to the drag impact', () => {
                const expected: DragImpact = {
                  movement: {
                    displaced: [
                      {
                        draggableId: preset.inHome2.descriptor.id,
                        isVisible: true,
                        shouldAnimate: true,
                      },
                    ],
                    amount: patch(
                      axis.line,
                      preset.inHome3.page.marginBox[axis.size],
                    ),
                    isBeyondStartPosition: false,
                  },
                  destination: {
                    droppableId: preset.home.descriptor.id,
                    // is now in the second position
                    index: 1,
                  },
                  direction: axis.direction,
                };

                expect(result.impact).toEqual(expected);
              });
            });
          });

          describe('is moving towards the start position', () => {
            describe('moving back to original position', () => {
              // dragged the second item (draggable2) forward once, and is now
              // moving backwards towards the start again
              const previousImpact: DragImpact = {
                movement: {
                  displaced: [
                    {
                      draggableId: preset.inHome3.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
                  ],
                  amount: patch(
                    axis.line,
                    preset.inHome2.page.marginBox[axis.size],
                  ),
                  isBeyondStartPosition: true,
                },
                direction: axis.direction,
                destination: {
                  index: 2,
                  droppableId: preset.home.descriptor.id,
                },
              };
              const result: ?Result = moveToNextIndex({
                isMovingForward: false,
                draggableId: preset.inHome2.descriptor.id,
                previousImpact,
                // roughly correct
                previousPageBorderBoxCenter:
                  preset.inHome3.page.borderBox.center,
                draggables: preset.draggables,
                viewport: customViewport,
                droppable: preset.home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the end of the draggable to the end of the next draggable (which is its original position)', () => {
                const expected: Position = moveToEdge({
                  source: preset.inHome2.page.borderBox,
                  sourceEdge: 'end',
                  // destination is itself as moving back to home
                  destination: preset.inHome2.page.borderBox,
                  destinationEdge: 'end',
                  destinationAxis: axis,
                });

                expect(result.pageBorderBoxCenter).toEqual(expected);
                // moved back to its original position
                expect(result.pageBorderBoxCenter).toEqual(
                  preset.inHome2.page.borderBox.center,
                );
              });

              it('should return an empty impact', () => {
                const expected: DragImpact = {
                  movement: {
                    displaced: [],
                    amount: patch(
                      axis.line,
                      preset.inHome2.page.marginBox[axis.size],
                    ),
                    isBeyondStartPosition: false,
                  },
                  destination: {
                    droppableId: preset.home.descriptor.id,
                    index: 1,
                  },
                  direction: axis.direction,
                };

                expect(result.impact).toEqual(expected);
              });
            });

            describe('moving back, but not far enough to be at the start yet', () => {
              // dragged the first item:
              // forward twice so it is in the third position
              // then moving backward so it is in the second position
              const previousImpact: DragImpact = {
                movement: {
                  // sorted by closest to where the draggable currently is
                  displaced: [
                    {
                      draggableId: preset.inHome3.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
                    {
                      draggableId: preset.inHome2.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
                  ],
                  amount: patch(
                    axis.line,
                    preset.inHome1.page.marginBox[axis.size],
                  ),
                  isBeyondStartPosition: true,
                },
                direction: axis.direction,
                destination: {
                  index: 2,
                  droppableId: preset.home.descriptor.id,
                },
              };
              const result: ?Result = moveToNextIndex({
                isMovingForward: false,
                draggableId: preset.inHome1.descriptor.id,
                previousImpact,
                // roughly correct
                previousPageBorderBoxCenter:
                  preset.inHome3.page.borderBox.center,
                draggables: preset.draggables,
                viewport: customViewport,
                droppable: preset.home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the end of the draggable to the end of the previous draggable', () => {
                const expected: Position = moveToEdge({
                  source: preset.inHome1.page.borderBox,
                  sourceEdge: 'end',
                  destination: preset.inHome2.page.borderBox,
                  destinationEdge: 'end',
                  destinationAxis: axis,
                });

                expect(result.pageBorderBoxCenter).toEqual(expected);
              });

              it('should remove the third draggable from the drag impact', () => {
                const expected: DragImpact = {
                  movement: {
                    // draggable3 has been removed
                    displaced: [
                      {
                        draggableId: preset.inHome2.descriptor.id,
                        isVisible: true,
                        shouldAnimate: true,
                      },
                    ],
                    amount: patch(
                      axis.line,
                      preset.inHome1.page.marginBox[axis.size],
                    ),
                    isBeyondStartPosition: true,
                  },
                  destination: {
                    droppableId: preset.home.descriptor.id,
                    index: 1,
                  },
                  direction: axis.direction,
                };

                expect(result.impact).toEqual(expected);
              });
            });
          });
        });

        describe('visibility', () => {
          describe('viewport visibility', () => {
            const droppable: DroppableDimension = getDroppableDimension({
              descriptor: {
                id: 'much bigger than viewport',
                type: 'huge',
              },
              direction: axis.direction,
              borderBox: {
                top: 0,
                right: 10000,
                bottom: 10000,
                left: 0,
              },
            });

            it('should request a jump scroll for movement that is outside of the viewport', () => {
              const asBigAsViewport: DraggableDimension = getDraggableDimension(
                {
                  descriptor: {
                    id: 'inside',
                    index: 0,
                    droppableId: droppable.descriptor.id,
                    type: droppable.descriptor.type,
                  },
                  borderBox: customViewport.frame,
                },
              );
              const outsideViewport: DraggableDimension = getDraggableDimension(
                {
                  descriptor: {
                    id: 'outside',
                    index: 1,
                    droppableId: droppable.descriptor.id,
                    type: droppable.descriptor.type,
                  },
                  borderBox: {
                    // is bottom left of the viewport
                    top: customViewport.frame.bottom + 1,
                    right: customViewport.frame.right + 100,
                    left: customViewport.frame.right + 1,
                    bottom: customViewport.frame.bottom + 100,
                  },
                },
              );
              // inViewport is in its original position
              const previousImpact: DragImpact = {
                movement: noMovement,
                direction: axis.direction,
                destination: {
                  index: 0,
                  droppableId: droppable.descriptor.id,
                },
              };
              const draggables: DraggableDimensionMap = {
                [asBigAsViewport.descriptor.id]: asBigAsViewport,
                [outsideViewport.descriptor.id]: outsideViewport,
              };
              const expectedCenter = moveToEdge({
                source: asBigAsViewport.page.borderBox,
                sourceEdge: 'end',
                destination: outsideViewport.page.marginBox,
                destinationEdge: 'end',
                destinationAxis: axis,
              });
              const previousPageBorderBoxCenter: Position =
                asBigAsViewport.page.borderBox.center;
              const expectedScrollJump: Position = subtract(
                expectedCenter,
                previousPageBorderBoxCenter,
              );
              const expectedImpact: DragImpact = {
                movement: {
                  displaced: [
                    {
                      draggableId: outsideViewport.descriptor.id,
                      // Even though the item started in an invisible place we force
                      // the displacement to be visible.
                      isVisible: true,
                      shouldAnimate: true,
                    },
                  ],
                  amount: patch(
                    axis.line,
                    asBigAsViewport.page.marginBox[axis.size],
                  ),
                  isBeyondStartPosition: true,
                },
                destination: {
                  droppableId: droppable.descriptor.id,
                  index: 1,
                },
                direction: axis.direction,
              };

              const result: ?Result = moveToNextIndex({
                isMovingForward: true,
                draggableId: asBigAsViewport.descriptor.id,
                previousImpact,
                previousPageBorderBoxCenter,
                draggables,
                droppable,
                viewport: customViewport,
              });

              if (!result) {
                throw new Error('Invalid test setup');
              }

              // not updating the page center (visually the item will not move)
              expect(result.pageBorderBoxCenter).toEqual(
                previousPageBorderBoxCenter,
              );
              expect(result.scrollJumpRequest).toEqual(expectedScrollJump);
              expect(result.impact).toEqual(expectedImpact);
            });

            it('should force visible displacement when displacing an invisible item', () => {
              const visible: DraggableDimension = getDraggableDimension({
                descriptor: {
                  id: 'inside',
                  index: 0,
                  droppableId: droppable.descriptor.id,
                  type: droppable.descriptor.type,
                },
                borderBox: {
                  top: 0,
                  left: 0,
                  right: customViewport.frame.right - 100,
                  bottom: customViewport.frame.bottom - 100,
                },
              });
              const invisible: DraggableDimension = getDraggableDimension({
                descriptor: {
                  id: 'partial',
                  index: 1,
                  droppableId: droppable.descriptor.id,
                  type: droppable.descriptor.type,
                },
                borderBox: {
                  top: customViewport.frame.bottom + 1,
                  left: customViewport.frame.right + 1,
                  bottom: customViewport.frame.bottom + 100,
                  right: customViewport.frame.right + 100,
                },
              });
              // inViewport is in its original position
              const previousImpact: DragImpact = {
                movement: noMovement,
                direction: axis.direction,
                destination: {
                  index: 0,
                  droppableId: droppable.descriptor.id,
                },
              };
              const draggables: DraggableDimensionMap = {
                [visible.descriptor.id]: visible,
                [invisible.descriptor.id]: invisible,
              };
              const previousPageBorderBoxCenter: Position =
                visible.page.borderBox.center;
              const expectedImpact: DragImpact = {
                movement: {
                  displaced: [
                    {
                      draggableId: invisible.descriptor.id,
                      // Even though the item started in an invisible place we force
                      // the displacement to be visible.
                      isVisible: true,
                      shouldAnimate: true,
                    },
                  ],
                  amount: patch(axis.line, visible.page.marginBox[axis.size]),
                  isBeyondStartPosition: true,
                },
                destination: {
                  droppableId: droppable.descriptor.id,
                  index: 1,
                },
                direction: axis.direction,
              };

              const result: ?Result = moveToNextIndex({
                isMovingForward: true,
                draggableId: visible.descriptor.id,
                previousImpact,
                previousPageBorderBoxCenter,
                draggables,
                droppable,
                viewport: customViewport,
              });

              if (!result) {
                throw new Error('Invalid test setup');
              }

              expect(result.impact).toEqual(expectedImpact);
            });
          });

          describe('droppable visibility', () => {
            it('should request a scroll jump into non-visible areas', () => {
              const droppable: DroppableDimension = getDroppableDimension({
                descriptor: {
                  id: 'much bigger than viewport',
                  type: 'huge',
                },
                direction: axis.direction,
                borderBox: {
                  top: 0,
                  left: 0,
                  // cut off by frame
                  bottom: 200,
                  right: 200,
                },
                closest: {
                  borderBox: {
                    top: 0,
                    left: 0,
                    right: 100,
                    bottom: 100,
                  },
                  scrollHeight: 200,
                  scrollWidth: 200,
                  scroll: { x: 0, y: 0 },
                  shouldClipSubject: true,
                },
              });
              const inside: DraggableDimension = getDraggableDimension({
                descriptor: {
                  id: 'inside',
                  index: 0,
                  droppableId: droppable.descriptor.id,
                  type: droppable.descriptor.type,
                },
                borderBox: {
                  top: 0,
                  left: 0,
                  // bleeding over the frame
                  right: 110,
                  bottom: 110,
                },
              });
              const outside: DraggableDimension = getDraggableDimension({
                descriptor: {
                  id: 'outside',
                  index: 1,
                  droppableId: droppable.descriptor.id,
                  type: droppable.descriptor.type,
                },
                borderBox: {
                  // in the droppable, but outside the frame
                  top: 120,
                  left: 120,
                  right: 180,
                  bottom: 180,
                },
              });
              const previousImpact: DragImpact = {
                movement: noMovement,
                direction: axis.direction,
                destination: {
                  index: 0,
                  droppableId: droppable.descriptor.id,
                },
              };
              const draggables: DraggableDimensionMap = {
                [inside.descriptor.id]: inside,
                [outside.descriptor.id]: outside,
              };
              const previousPageBorderBoxCenter: Position =
                inside.page.borderBox.center;
              const expectedCenter = moveToEdge({
                source: inside.page.borderBox,
                sourceEdge: 'end',
                destination: outside.page.marginBox,
                destinationEdge: 'end',
                destinationAxis: axis,
              });
              const expectedScrollJump: Position = subtract(
                expectedCenter,
                previousPageBorderBoxCenter,
              );
              const expectedImpact: DragImpact = {
                movement: {
                  displaced: [
                    {
                      draggableId: outside.descriptor.id,
                      // Even though the item started in an invisible place we force
                      // the displacement to be visible.
                      isVisible: true,
                      shouldAnimate: true,
                    },
                  ],
                  amount: patch(axis.line, inside.page.marginBox[axis.size]),
                  isBeyondStartPosition: true,
                },
                destination: {
                  droppableId: droppable.descriptor.id,
                  index: 1,
                },
                direction: axis.direction,
              };

              const result: ?Result = moveToNextIndex({
                isMovingForward: true,
                draggableId: inside.descriptor.id,
                previousImpact,
                previousPageBorderBoxCenter,
                draggables,
                droppable,
                viewport: customViewport,
              });

              if (!result) {
                throw new Error('Invalid test setup');
              }

              expect(result.pageBorderBoxCenter).toEqual(
                previousPageBorderBoxCenter,
              );
              expect(result.impact).toEqual(expectedImpact);
              expect(result.scrollJumpRequest).toEqual(expectedScrollJump);
            });
          });
        });
      });

      describe('in foreign list', () => {
        describe('moving forwards', () => {
          describe('moving forward one position', () => {
            // moved home1 into the first position of the foreign list
            const previousImpact: DragImpact = {
              movement: {
                // Ordered by the closest impacted.
                // Because we have moved into the first position it will be ordered 1-2-3
                displaced: [
                  {
                    draggableId: preset.inForeign1.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                  {
                    draggableId: preset.inForeign2.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                  {
                    draggableId: preset.inForeign3.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                ],
                amount: patch(
                  axis.line,
                  preset.inHome1.page.marginBox[axis.size],
                ),
                // Always false when in another list
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                // it is now in the foreign droppable in the first position
                droppableId: preset.foreign.descriptor.id,
                index: 0,
              },
            };

            const result: ?Result = moveToNextIndex({
              isMovingForward: true,
              draggableId: preset.inHome1.descriptor.id,
              previousImpact,
              previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
              droppable: preset.foreign,
              draggables: preset.draggables,
              viewport: customViewport,
            });

            if (!result) {
              throw new Error('invalid test setup');
            }

            it('should move to the start edge of the dragging item to the start of foreign2', () => {
              const expected = moveToEdge({
                source: preset.inHome1.page.borderBox,
                sourceEdge: 'start',
                destination: preset.inForeign2.page.marginBox,
                destinationEdge: 'start',
                destinationAxis: preset.foreign.axis,
              });

              expect(result.pageBorderBoxCenter).toEqual(expected);
            });

            it('should remove foreign1 when moving forward', () => {
              const expected: DragImpact = {
                movement: {
                  displaced: [
                    {
                      draggableId: preset.inForeign2.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
                    {
                      draggableId: preset.inForeign3.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
                  ],
                  amount: patch(
                    axis.line,
                    preset.inHome1.page.marginBox[axis.size],
                  ),
                  isBeyondStartPosition: false,
                },
                direction: axis.direction,
                destination: {
                  droppableId: preset.foreign.descriptor.id,
                  index: 1,
                },
              };

              expect(result.impact).toEqual(expected);
            });
          });

          describe('moving after the last item in a list', () => {
            // moved home1 into the second last position of the list
            const previousImpact: DragImpact = {
              movement: {
                // Ordered by the closest impacted.
                displaced: [
                  {
                    draggableId: preset.inForeign4.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                ],
                amount: patch(
                  axis.line,
                  preset.inHome1.page.marginBox[axis.size],
                ),
                // Always false when in another list
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                // it is now in the foreign droppable in the third position
                droppableId: preset.foreign.descriptor.id,
                index: preset.inForeign4.descriptor.index,
              },
            };

            const result: ?Result = moveToNextIndex({
              isMovingForward: true,
              draggableId: preset.inHome1.descriptor.id,
              previousImpact,
              previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
              droppable: preset.foreign,
              draggables: preset.draggables,
              viewport: customViewport,
            });

            if (!result) {
              throw new Error('invalid test setup');
            }

            it('should move to the start edge of the dragging item to the end of foreign1', () => {
              const expected = moveToEdge({
                source: preset.inHome1.page.borderBox,
                sourceEdge: 'start',
                destination: preset.inForeign4.page.marginBox,
                destinationEdge: 'end',
                destinationAxis: preset.foreign.axis,
              });

              expect(result.pageBorderBoxCenter).toEqual(expected);
            });

            it('should remove foreign4 when moving forward', () => {
              const expected: DragImpact = {
                movement: {
                  displaced: [],
                  amount: patch(
                    axis.line,
                    preset.inHome1.page.marginBox[axis.size],
                  ),
                  isBeyondStartPosition: false,
                },
                direction: axis.direction,
                destination: {
                  droppableId: preset.foreign.descriptor.id,
                  // bigger than the original list
                  index: preset.inForeignList.length,
                },
              };

              expect(result.impact).toEqual(expected);
            });
          });

          it('should return null if attempting to move beyond end of the list', () => {
            // home1 is now in the last position of the list
            const previousImpact: DragImpact = {
              movement: {
                displaced: [],
                amount: patch(
                  axis.line,
                  preset.inHome1.page.marginBox[axis.size],
                ),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                droppableId: preset.foreign.descriptor.id,
                // already past the last item
                index: preset.inHomeList.length,
              },
            };

            const result: ?Result = moveToNextIndex({
              isMovingForward: true,
              draggableId: preset.inHome1.descriptor.id,
              previousImpact,
              // roughly correct
              previousPageBorderBoxCenter: preset.inHome4.page.borderBox.center,
              droppable: preset.foreign,
              viewport: customViewport,
              draggables: preset.draggables,
            });

            expect(result).toBe(null);
          });
        });

        describe('moving backwards', () => {
          it('should return null if attempting to move backwards beyond the start of the list', () => {
            // moved home1 into the first position of the foreign list
            const previousImpact: DragImpact = {
              movement: {
                // Ordered by the closest impacted.
                // Because we have moved into the first position it will be ordered 1-2-3
                displaced: [
                  {
                    draggableId: preset.inForeign1.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                  {
                    draggableId: preset.inForeign2.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                  {
                    draggableId: preset.inForeign3.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                  {
                    draggableId: preset.inForeign4.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                ],
                amount: patch(
                  axis.line,
                  preset.inHome1.page.marginBox[axis.size],
                ),
                // Always false when in another list
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                // it is now in the foreign droppable in the first position
                droppableId: preset.foreign.descriptor.id,
                index: 0,
              },
            };

            const result: ?Result = moveToNextIndex({
              isMovingForward: false,
              draggableId: preset.inHome1.descriptor.id,
              previousImpact,
              // roughly correct
              previousPageBorderBoxCenter:
                preset.inForeign1.page.borderBox.center,
              droppable: preset.foreign,
              viewport: customViewport,
              draggables: preset.draggables,
            });

            expect(result).toBe(null);
          });

          describe('moving backwards one position in list', () => {
            // home1 is just before the last inForeign
            const previousImpact: DragImpact = {
              movement: {
                // Ordered by the closest impacted.
                displaced: [
                  {
                    draggableId: preset.inForeign4.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                ],
                amount: patch(
                  axis.line,
                  preset.inHome1.page.marginBox[axis.size],
                ),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                droppableId: preset.foreign.descriptor.id,
                index: 3,
              },
            };

            const result: ?Result = moveToNextIndex({
              isMovingForward: false,
              draggableId: preset.inHome1.descriptor.id,
              previousImpact,
              // roughly correct
              previousPageBorderBoxCenter:
                preset.inForeign4.page.borderBox.center,
              droppable: preset.foreign,
              viewport: customViewport,
              draggables: preset.draggables,
            });

            if (!result) {
              throw new Error('invalid test setup');
            }

            it('should move to the start edge of foreign3', () => {
              const expected: Position = moveToEdge({
                source: preset.inHome1.page.borderBox,
                sourceEdge: 'start',
                destination: preset.inForeign3.page.marginBox,
                destinationEdge: 'start',
                destinationAxis: axis,
              });

              expect(result.pageBorderBoxCenter).toEqual(expected);
            });

            it('should add foreign3 to the drag impact', () => {
              const expected: DragImpact = {
                movement: {
                  // Ordered by the closest impacted.
                  displaced: [
                    {
                      draggableId: preset.inForeign3.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
                    {
                      draggableId: preset.inForeign4.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
                  ],
                  amount: patch(
                    axis.line,
                    preset.inHome1.page.marginBox[axis.size],
                  ),
                  isBeyondStartPosition: false,
                },
                direction: axis.direction,
                destination: {
                  droppableId: preset.foreign.descriptor.id,
                  // moved backwards
                  index: 2,
                },
              };

              expect(result.impact).toEqual(expected);
            });
          });

          describe('moving backwards into the first position of the list', () => {
            // currently home1 is in the second position in front of foreign1
            const previousImpact: DragImpact = {
              movement: {
                // Ordered by the closest impacted.
                displaced: [
                  {
                    draggableId: preset.inForeign2.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                  {
                    draggableId: preset.inForeign3.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                  {
                    draggableId: preset.inForeign4.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                ],
                amount: patch(
                  axis.line,
                  preset.inHome1.page.marginBox[axis.size],
                ),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                droppableId: preset.foreign.descriptor.id,
                index: 1,
              },
            };

            const result: ?Result = moveToNextIndex({
              isMovingForward: false,
              draggableId: preset.inHome1.descriptor.id,
              previousImpact,
              // roughly correct
              previousPageBorderBoxCenter:
                preset.inForeign2.page.borderBox.center,
              droppable: preset.foreign,
              viewport: customViewport,
              draggables: preset.draggables,
            });

            if (!result) {
              throw new Error('invalid test setup');
            }

            it('should move the start edge of home1 to the start edge of foreign1', () => {
              const expected: Position = moveToEdge({
                source: preset.inHome1.page.borderBox,
                sourceEdge: 'start',
                destination: preset.inForeign1.page.marginBox,
                destinationEdge: 'start',
                destinationAxis: axis,
              });

              expect(result.pageBorderBoxCenter).toEqual(expected);
            });

            it('should add foreign1 to the impact', () => {
              const expected: DragImpact = {
                movement: {
                  displaced: [
                    {
                      draggableId: preset.inForeign1.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
                    {
                      draggableId: preset.inForeign2.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
                    {
                      draggableId: preset.inForeign3.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
                    {
                      draggableId: preset.inForeign4.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
                  ],
                  amount: patch(
                    axis.line,
                    preset.inHome1.page.marginBox[axis.size],
                  ),
                  isBeyondStartPosition: false,
                },
                direction: axis.direction,
                destination: {
                  droppableId: preset.foreign.descriptor.id,
                  // now in the first position
                  index: 0,
                },
              };
              expect(result.impact).toEqual(expected);
            });
          });
        });
      });
    });
  });
});
