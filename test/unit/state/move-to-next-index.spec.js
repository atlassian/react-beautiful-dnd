// @flow
import moveToNextIndex from '../../../src/state/move-to-next-index/';
import type { Result } from '../../../src/state/move-to-next-index/move-to-next-index-types';
import { getPreset, disableDroppable } from '../../utils/dimension';
import moveToEdge from '../../../src/state/move-to-edge';
import noImpact, { noMovement } from '../../../src/state/no-impact';
import { patch } from '../../../src/state/position';
import { vertical, horizontal } from '../../../src/state/axis';
import getViewport from '../../../src/state/visibility/get-viewport';
import getArea from '../../../src/state/get-area';
import setWindowScroll from '../../utils/set-window-scroll';
import { getDroppableDimension, getDraggableDimension } from '../../../src/state/dimension';
import type {
  Area,
  Axis,
  DragImpact,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimension,
  DraggableLocation,
  Position,
} from '../../../src/types';

const setViewport = (custom: Area): void => {
  window.pageYOffset = custom.top;
  window.pageXOffset = custom.left;
  window.innerWidth = custom.width;
  window.innerHeight = custom.height;
};

const originalViewport: Area = getViewport();

const customViewport: Area = getArea({
  top: 0,
  left: 0,
  bottom: 1000,
  right: 1000,
});

describe('move to next index', () => {
  beforeEach(() => {
    setViewport(customViewport);
  });

  afterAll(() => {
    setViewport(originalViewport);
  });

  [vertical, horizontal].forEach((axis: Axis) => {
    describe(`on the ${axis.direction} axis`, () => {
      const preset = getPreset(axis);

      it('should return null if the droppable is disabled', () => {
        const disabled: DroppableDimension = disableDroppable(preset.home);

        const result: ?Result = moveToNextIndex({
          isMovingForward: true,
          draggableId: preset.inHome1.descriptor.id,
          previousImpact: noImpact,
          droppable: disabled,
          draggables: preset.draggables,
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
              droppable: preset.home,
              draggables: preset.draggables,
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
                draggables: preset.draggables,
                droppable: preset.home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the end of the dragging item to the end of the next item', () => {
                const expected: Position = moveToEdge({
                  source: preset.inHome1.page.withoutMargin,
                  sourceEdge: 'end',
                  destination: preset.inHome2.page.withoutMargin,
                  destinationEdge: 'end',
                  destinationAxis: axis,
                });

                expect(result.pageCenter).toEqual(expected);
              });

              it('should move the item into the second spot and move the second item out of the way', () => {
                const expected: DragImpact = {
                  movement: {
                    displaced: [{
                      draggableId: preset.inHome2.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    }],
                    amount: patch(axis.line, preset.inHome1.page.withMargin[axis.size]),
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
                draggables: preset.draggables,
                droppable: preset.home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the end of the dragging item to the end of the next item', () => {
                const expected: Position = moveToEdge({
                  source: preset.inHome2.page.withoutMargin,
                  sourceEdge: 'end',
                  destination: preset.inHome3.page.withoutMargin,
                  destinationEdge: 'end',
                  destinationAxis: axis,
                });

                expect(result.pageCenter).toEqual(expected);
              });

              it('should move the dragging item into the third spot and move the third item out of the way', () => {
                const expected: DragImpact = {
                  movement: {
                    displaced: [{
                      draggableId: preset.inHome3.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    }],
                    amount: patch(axis.line, preset.inHome2.page.withMargin[axis.size]),
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
                  displaced: [{
                    draggableId: preset.inHome2.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  }],
                  amount: patch(axis.line, preset.inHome1.page.withMargin[axis.size]),
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
                draggables: preset.draggables,
                droppable: preset.home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the end of the dragging item to the end of the next item', () => {
                // next dimension from the current index is draggable3
                const expected: Position = moveToEdge({
                  source: preset.inHome1.page.withoutMargin,
                  sourceEdge: 'end',
                  destination: preset.inHome3.page.withoutMargin,
                  destinationEdge: 'end',
                  destinationAxis: axis,
                });

                expect(result.pageCenter).toEqual(expected);
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
                    amount: patch(axis.line, preset.inHome1.page.withMargin[axis.size]),
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
                  displaced: [{
                    draggableId: preset.inHome1.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  }],
                  amount: patch(axis.line, preset.inHome2.page.withMargin[axis.size]),
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
                draggables: preset.draggables,
                droppable: preset.home,
              });

              if (!result) {
                throw new Error('invalid result of moveToNextIndex');
              }

              it('should move the start of the dragging item to the end of the previous item (which its original position)', () => {
                const expected: Position = moveToEdge({
                  source: preset.inHome2.page.withoutMargin,
                  sourceEdge: 'start',
                  destination: preset.inHome2.page.withoutMargin,
                  destinationEdge: 'start',
                  destinationAxis: axis,
                });

                expect(result.pageCenter).toEqual(expected);
                // is now back at its original position
                expect(result.pageCenter).toEqual(preset.inHome2.page.withoutMargin.center);
              });

              it('should return an empty impact', () => {
                const expected: DragImpact = {
                  movement: {
                    displaced: [],
                    amount: patch(axis.line, preset.inHome2.page.withMargin[axis.size]),
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
                  amount: patch(axis.line, preset.inHome3.page.withMargin[axis.size]),
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
                draggables: preset.draggables,
                droppable: preset.home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move to the start of the draggable item to the start position of the destination draggable', () => {
                const expected: Position = moveToEdge({
                  source: preset.inHome3.page.withoutMargin,
                  sourceEdge: 'start',
                  destination: preset.inHome2.page.withoutMargin,
                  destinationEdge: 'start',
                  destinationAxis: axis,
                });

                expect(result.pageCenter).toEqual(expected);
              });

              it('should remove the first dimension from the impact', () => {
                const expected: DragImpact = {
                  movement: {
                    displaced: [{
                      draggableId: preset.inHome2.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    }],
                    amount: patch(axis.line, preset.inHome3.page.withMargin[axis.size]),
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
          });
        });

        describe('moving backwards', () => {
          it('should return null if cannot move backward', () => {
            const previousImpact: DragImpact = {
              movement: {
                displaced: [],
                amount: patch(axis.line, preset.inHome1.page.withMargin[axis.size]),
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
              draggables: preset.draggables,
              droppable: preset.home,
            });

            expect(result).toBe(null);
          });

          describe('is moving away from start position', () => {
            describe('dragging the second item back to the first position', () => {
              // no impact yet
              const previousImpact: DragImpact = {
                movement: {
                  displaced: [],
                  amount: patch(axis.line, preset.inHome2.page.withMargin[axis.size]),
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
                draggables: preset.draggables,
                droppable: preset.home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the start of the draggable to the start of the previous draggable', () => {
                const expected: Position = moveToEdge({
                  source: preset.inHome2.page.withoutMargin,
                  sourceEdge: 'start',
                  destination: preset.inHome1.page.withoutMargin,
                  destinationEdge: 'start',
                  destinationAxis: axis,
                });

                expect(result.pageCenter).toEqual(expected);
              });

              it('should add the first draggable to the drag impact', () => {
                const expected: DragImpact = {
                  movement: {
                    displaced: [{
                      draggableId: preset.inHome1.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    }],
                    amount: patch(axis.line, preset.inHome2.page.withMargin[axis.size]),
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
                  amount: patch(axis.line, preset.inHome3.page.withMargin[axis.size]),
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
                draggables: preset.draggables,
                droppable: preset.home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the start of the draggable to the start of the previous draggable', () => {
                const expected: Position = moveToEdge({
                  source: preset.inHome3.page.withoutMargin,
                  sourceEdge: 'start',
                  destination: preset.inHome2.page.withoutMargin,
                  destinationEdge: 'start',
                  destinationAxis: axis,
                });

                expect(result.pageCenter).toEqual(expected);
              });

              it('should add the second draggable to the drag impact', () => {
                const expected: DragImpact = {
                  movement: {
                    displaced: [{
                      draggableId: preset.inHome2.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    }],
                    amount: patch(axis.line, preset.inHome3.page.withMargin[axis.size]),
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
                  displaced: [{
                    draggableId: preset.inHome3.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  }],
                  amount: patch(axis.line, preset.inHome2.page.withMargin[axis.size]),
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
                draggables: preset.draggables,
                droppable: preset.home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the end of the draggable to the end of the next draggable (which is its original position)', () => {
                const expected: Position = moveToEdge({
                  source: preset.inHome2.page.withoutMargin,
                  sourceEdge: 'end',
                  // destination is itself as moving back to home
                  destination: preset.inHome2.page.withoutMargin,
                  destinationEdge: 'end',
                  destinationAxis: axis,
                });

                expect(result.pageCenter).toEqual(expected);
                // moved back to its original position
                expect(result.pageCenter).toEqual(preset.inHome2.page.withoutMargin.center);
              });

              it('should return an empty impact', () => {
                const expected: DragImpact = {
                  movement: {
                    displaced: [],
                    amount: patch(axis.line, preset.inHome2.page.withMargin[axis.size]),
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
                  amount: patch(axis.line, preset.inHome1.page.withMargin[axis.size]),
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
                draggables: preset.draggables,
                droppable: preset.home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the end of the draggable to the end of the previous draggable', () => {
                const expected: Position = moveToEdge({
                  source: preset.inHome1.page.withoutMargin,
                  sourceEdge: 'end',
                  destination: preset.inHome2.page.withoutMargin,
                  destinationEdge: 'end',
                  destinationAxis: axis,
                });

                expect(result.pageCenter).toEqual(expected);
              });

              it('should remove the third draggable from the drag impact', () => {
                const expected: DragImpact = {
                  movement: {
                    // draggable3 has been removed
                    displaced: [{
                      draggableId: preset.inHome2.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    }],
                    amount: patch(axis.line, preset.inHome1.page.withMargin[axis.size]),
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
              client: getArea({
                top: 0,
                right: 10000,
                bottom: 10000,
                left: 0,
              }),
              direction: axis.direction,
            });
            const inViewport: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'inside',
                index: 0,
                droppableId: droppable.descriptor.id,
              },
              client: customViewport,
            });
            const outsideViewport: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'outside',
                index: 1,
                droppableId: droppable.descriptor.id,
              },
              client: getArea({
                // is bottom left of the viewport
                top: customViewport.bottom + 1,
                right: customViewport.right + 100,
                left: customViewport.right + 1,
                bottom: customViewport.bottom + 100,
              }),
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
              [inViewport.descriptor.id]: inViewport,
              [outsideViewport.descriptor.id]: outsideViewport,
            };

            it('should not permit movement into areas that are outside the viewport', () => {
              const result: ?Result = moveToNextIndex({
                isMovingForward: true,
                draggableId: inViewport.descriptor.id,
                previousImpact,
                draggables,
                droppable,
              });

              expect(result).toBe(null);
            });

            it('should take into account any changes in the droppables scroll', () => {
              // scrolling so that outsideViewport is now visible
              setWindowScroll({ x: 200, y: 200 });
              const expectedCenter = moveToEdge({
                source: inViewport.page.withoutMargin,
                sourceEdge: 'end',
                destination: outsideViewport.page.withMargin,
                destinationEdge: 'end',
                destinationAxis: axis,
              });
              const expectedImpact: DragImpact = {
                movement: {
                  displaced: [{
                    draggableId: outsideViewport.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  }],
                  amount: patch(axis.line, inViewport.page.withMargin[axis.size]),
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
                draggableId: inViewport.descriptor.id,
                previousImpact,
                draggables,
                droppable,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              expect(result.pageCenter).toEqual(expectedCenter);
              expect(result.impact).toEqual(expectedImpact);
            });
          });

          describe('droppable visibility', () => {
            it('should not permit movement into areas that outside of the droppable frame', () => {
              const droppable: DroppableDimension = getDroppableDimension({
                descriptor: {
                  id: 'much bigger than viewport',
                  type: 'huge',
                },
                client: getArea({
                  top: 0,
                  left: 0,
                  // cut off by frame
                  bottom: 200,
                  right: 200,
                }),
                frameClient: getArea({
                  top: 0,
                  left: 0,
                  right: 100,
                  bottom: 100,
                }),
                direction: axis.direction,
              });
              const inside: DraggableDimension = getDraggableDimension({
                descriptor: {
                  id: 'inside',
                  index: 0,
                  droppableId: droppable.descriptor.id,
                },
                client: getArea({
                  top: 0,
                  left: 0,
                  // bleeding over the frame
                  right: 110,
                  bottom: 110,
                }),
              });
              const outside: DraggableDimension = getDraggableDimension({
                descriptor: {
                  id: 'outside',
                  index: 1,
                  droppableId: droppable.descriptor.id,
                },
                client: getArea({
                  // in the droppable, but outside the frame
                  top: 120,
                  left: 120,
                  right: 180,
                  bottom: 180,
                }),
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
                [inside.descriptor.id]: inside,
                [outside.descriptor.id]: outside,
              };

              const result: ?Result = moveToNextIndex({
                isMovingForward: true,
                draggableId: inside.descriptor.id,
                previousImpact,
                draggables,
                droppable,
              });

              expect(result).toBe(null);
            });

            it.skip('should take into account any changes in the droppables scroll', () => {
              // TODO
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
                amount: patch(axis.line, preset.inHome1.page.withMargin[axis.size]),
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
              droppable: preset.foreign,
              draggables: preset.draggables,
            });

            if (!result) {
              throw new Error('invalid test setup');
            }

            it('should move to the start edge of the dragging item to the start of foreign2', () => {
              const expected = moveToEdge({
                source: preset.inHome1.page.withoutMargin,
                sourceEdge: 'start',
                destination: preset.inForeign2.page.withMargin,
                destinationEdge: 'start',
                destinationAxis: preset.foreign.axis,
              });

              expect(result.pageCenter).toEqual(expected);
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
                  amount: patch(axis.line, preset.inHome1.page.withMargin[axis.size]),
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
                displaced: [{
                  draggableId: preset.inForeign4.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                }],
                amount: patch(axis.line, preset.inHome1.page.withMargin[axis.size]),
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
              droppable: preset.foreign,
              draggables: preset.draggables,
            });

            if (!result) {
              throw new Error('invalid test setup');
            }

            it('should move to the start edge of the dragging item to the end of foreign1', () => {
              const expected = moveToEdge({
                source: preset.inHome1.page.withoutMargin,
                sourceEdge: 'start',
                destination: preset.inForeign4.page.withMargin,
                destinationEdge: 'end',
                destinationAxis: preset.foreign.axis,
              });

              expect(result.pageCenter).toEqual(expected);
            });

            it('should remove foreign4 when moving forward', () => {
              const expected: DragImpact = {
                movement: {
                  displaced: [],
                  amount: patch(axis.line, preset.inHome1.page.withMargin[axis.size]),
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
                amount: patch(axis.line, preset.inHome1.page.withMargin[axis.size]),
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
              droppable: preset.foreign,
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
                amount: patch(axis.line, preset.inHome1.page.withMargin[axis.size]),
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
              droppable: preset.foreign,
              draggables: preset.draggables,
            });

            expect(result).toBe(null);
          });

          describe('moving backwards one position in list', () => {
            // home1 is just before the last inForeign
            const previousImpact: DragImpact = {
              movement: {
                // Ordered by the closest impacted.
                displaced: [{
                  draggableId: preset.inForeign4.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                }],
                amount: patch(axis.line, preset.inHome1.page.withMargin[axis.size]),
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
              droppable: preset.foreign,
              draggables: preset.draggables,
            });

            if (!result) {
              throw new Error('invalid test setup');
            }

            it('should move to the start edge of foreign3', () => {
              const expected: Position = moveToEdge({
                source: preset.inHome1.page.withoutMargin,
                sourceEdge: 'start',
                destination: preset.inForeign3.page.withMargin,
                destinationEdge: 'start',
                destinationAxis: axis,
              });

              expect(result.pageCenter).toEqual(expected);
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
                  amount: patch(axis.line, preset.inHome1.page.withMargin[axis.size]),
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
                amount: patch(axis.line, preset.inHome1.page.withMargin[axis.size]),
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
              droppable: preset.foreign,
              draggables: preset.draggables,
            });

            if (!result) {
              throw new Error('invalid test setup');
            }

            it('should move the start edge of home1 to the start edge of foreign1', () => {
              const expected: Position = moveToEdge({
                source: preset.inHome1.page.withoutMargin,
                sourceEdge: 'start',
                destination: preset.inForeign1.page.withMargin,
                destinationEdge: 'start',
                destinationAxis: axis,
              });

              expect(result.pageCenter).toEqual(expected);
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
                  amount: patch(axis.line, preset.inHome1.page.withMargin[axis.size]),
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
