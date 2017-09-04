// @flow
import jumpToNextIndex from '../../../src/state/jump-to-next-index';
import type { JumpToNextResult } from '../../../src/state/jump-to-next-index';
import { getDraggableDimension, getDroppableDimension } from '../../../src/state/dimension';
import getClientRect from '../../utils/get-client-rect';
import moveToEdge from '../../../src/state/move-to-edge';
import { patch } from '../../../src/state/position';
import { vertical, horizontal } from '../../../src/state/axis';
import type {
  Axis,
  DragMovement,
  DragImpact,
  DroppableId,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DraggableLocation,
  Position,
} from '../../../src/types';

const droppableId: DroppableId = 'drop-1';

describe('jump to next index', () => {
  [vertical, horizontal].forEach((axis: Axis) => {
    const droppable: DroppableDimension = getDroppableDimension({
      id: droppableId,
      direction: axis.direction,
      clientRect: getClientRect({
        top: 0,
        left: 0,
        bottom: 1000,
        right: 1000,
      }),
    });

    // size: 100
    const draggable1: DraggableDimension = getDraggableDimension({
      id: 'draggable1',
      droppableId,
      clientRect: getClientRect({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      }),
    });

    // size: 199
    const draggable2: DraggableDimension = getDraggableDimension({
      id: 'draggable2',
      droppableId,
      clientRect: getClientRect({
        top: 101,
        left: 101,
        bottom: 300,
        right: 300,
      }),
    });

    // size: 299
    const draggable3: DraggableDimension = getDraggableDimension({
      id: 'draggable3',
      droppableId,
      clientRect: getClientRect({
        top: 301,
        left: 301,
        bottom: 600,
        right: 600,
      }),
    });

    const droppables: DroppableDimensionMap = {
      [droppable.id]: droppable,
    };

    const draggables: DraggableDimensionMap = {
      [draggable1.id]: draggable1,
      [draggable2.id]: draggable2,
      [draggable3.id]: draggable3,
    };
    describe(`on the ${axis.direction} axis`, () => {
      describe('jump forward', () => {
        it('should return null if cannot move forward', () => {
          const impact: DragImpact = {
            movement: {
              draggables: [],
              amount: patch(axis.line, draggable1.page.withMargin[axis.size]),
              isBeyondStartPosition: false,
            },
            direction: axis.direction,
            destination: {
              index: 2,
              droppableId: droppable.id,
            },
          };

          const result: ?JumpToNextResult = jumpToNextIndex({
            isMovingForward: true,
            draggableId: draggable3.id,
            impact,
            draggables,
            droppables,
          });

          expect(result).toBe(null);
        });

        describe('is moving away from start position', () => {
          describe('dragging first item forward one position', () => {
            // dragging the first item forward into the second position
            const movement: DragMovement = {
              draggables: [],
              amount: patch(axis.line, draggable1.page.withMargin[axis.size]),
              isBeyondStartPosition: false,
            };
            const destination: DraggableLocation = {
              index: 0,
              droppableId: droppable.id,
            };
            const impact: DragImpact = {
              movement,
              direction: axis.direction,
              destination,
            };
            const result: ?JumpToNextResult = jumpToNextIndex({
              isMovingForward: true,
              draggableId: draggable1.id,
              impact,
              draggables,
              droppables,
            });

            if (!result) {
              throw new Error('invalid result');
            }

            it('should move the end of the dragging item to the end of the next item', () => {
              const expected: Position = moveToEdge({
                source: draggable1.page.withoutMargin,
                sourceEdge: 'end',
                destination: draggable2.page.withoutMargin,
                destinationEdge: 'end',
                destinationAxis: axis,
              });

              expect(result.center).toEqual(expected);
            });

            it('should move the item into the second spot and move the second item out of the way', () => {
              const expected: DragImpact = {
                movement: {
                  draggables: [draggable2.id],
                  amount: patch(axis.line, draggable1.page.withMargin[axis.size]),
                  isBeyondStartPosition: true,
                },
                direction: axis.direction,
                // is now in the second position
                destination: {
                  droppableId: droppable.id,
                  index: 1,
                },
              };

              expect(result.impact).toEqual(expected);
            });
          });

          describe('dragging second item forward one position', () => {
            const movement: DragMovement = {
              draggables: [],
              amount: patch(axis.line, draggable2.page.withMargin[axis.size]),
              isBeyondStartPosition: false,
            };
            const destination: DraggableLocation = {
              index: 1,
              droppableId: droppable.id,
            };
            const impact: DragImpact = {
              movement,
              direction: axis.direction,
              destination,
            };
            const result: ?JumpToNextResult = jumpToNextIndex({
              isMovingForward: true,
              draggableId: draggable2.id,
              impact,
              draggables,
              droppables,
            });

            if (!result) {
              throw new Error('invalid result');
            }

            it('should move the end of the dragging item to the end of the next item', () => {
              const expected: Position = moveToEdge({
                source: draggable2.page.withoutMargin,
                sourceEdge: 'end',
                destination: draggable3.page.withoutMargin,
                destinationEdge: 'end',
                destinationAxis: axis,
              });

              expect(result.center).toEqual(expected);
            });

            it('should move the dragging item into the third spot and move the third item out of the way', () => {
              const expected: DragImpact = {
                movement: {
                  draggables: [draggable3.id],
                  amount: patch(axis.line, draggable2.page.withMargin[axis.size]),
                  isBeyondStartPosition: true,
                },
                direction: axis.direction,
                // is now in the second position
                destination: {
                  droppableId: droppable.id,
                  index: 2,
                },
              };

              expect(result.impact).toEqual(expected);
            });
          });

          describe('dragging first item forward one position after already moving it forward once', () => {
            const impact: DragImpact = {
              movement: {
                // second item has already moved
                draggables: [draggable2.id],
                amount: patch(axis.line, draggable1.page.withMargin[axis.size]),
                isBeyondStartPosition: true,
              },
              direction: axis.direction,
              // draggable1 is now in the second position
              destination: {
                droppableId: droppable.id,
                index: 1,
              },
            };
            const result: ?JumpToNextResult = jumpToNextIndex({
              isMovingForward: true,
              draggableId: draggable1.id,
              impact,
              draggables,
              droppables,
            });

            if (!result) {
              throw new Error('invalid result');
            }

            it('should move the end of the dragging item to the end of the next item', () => {
              // next dimension from the current index is draggable3
              const expected: Position = moveToEdge({
                source: draggable1.page.withoutMargin,
                sourceEdge: 'end',
                destination: draggable3.page.withoutMargin,
                destinationEdge: 'end',
                destinationAxis: axis,
              });

              expect(result.center).toEqual(expected);
            });

            it('should move the third item out of the way', () => {
              const expected: DragImpact = {
                movement: {
                  // adding draggable3 to the list
                  draggables: [draggable2.id, draggable3.id],
                  amount: patch(axis.line, draggable1.page.withMargin[axis.size]),
                  isBeyondStartPosition: true,
                },
                direction: axis.direction,
                // is now in the second position
                destination: {
                  droppableId: droppable.id,
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
            const impact: DragImpact = {
              movement: {
                draggables: [draggable1.id],
                amount: patch(axis.line, draggable2.page.withMargin[axis.size]),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                index: 0,
                droppableId: droppable.id,
              },
            };
            const result: ?JumpToNextResult = jumpToNextIndex({
              isMovingForward: true,
              draggableId: draggable2.id,
              impact,
              draggables,
              droppables,
            });

            if (!result) {
              throw new Error('invalid result of jumpToNextIndex');
            }

            it('should move the start of the dragging item to the end of the previous item (which is itself)', () => {
              const expected: Position = moveToEdge({
                source: draggable2.page.withoutMargin,
                sourceEdge: 'start',
                destination: draggable2.page.withoutMargin,
                destinationEdge: 'start',
                destinationAxis: axis,
              });

              expect(result.center).toEqual(expected);
            });

            it('should return an empty impact', () => {
              const expected: DragImpact = {
                movement: {
                  draggables: [],
                  amount: patch(axis.line, draggable2.page.withMargin[axis.size]),
                  isBeyondStartPosition: false,
                },
                destination: {
                  droppableId: droppable.id,
                  index: 1,
                },
                direction: axis.direction,
              };

              expect(result.impact).toEqual(expected);
            });
          });

          describe('dragging forwards, but not beyond the starting position', () => {
            // draggable3 has moved backwards past draggable2 and draggable1
            const impact: DragImpact = {
              movement: {
                // second and first item have already moved
                draggables: [draggable2.id, draggable1.id],
                amount: patch(axis.line, draggable3.page.withMargin[axis.size]),
                isBeyondStartPosition: true,
              },
              direction: axis.direction,
              // draggable3 is now in the first position
              destination: {
                droppableId: droppable.id,
                index: 0,
              },
            };
            // moving draggable3 forward one position
            const result: ?JumpToNextResult = jumpToNextIndex({
              isMovingForward: true,
              draggableId: draggable3.id,
              impact,
              draggables,
              droppables,
            });

            if (!result) {
              throw new Error('invalid result');
            }

            it('should move to the start of the draggable item to the start position of the destination draggable', () => {
              const expected: Position = moveToEdge({
                source: draggable3.page.withoutMargin,
                sourceEdge: 'start',
                destination: draggable2.page.withoutMargin,
                destinationEdge: 'start',
                destinationAxis: axis,
              });

              expect(result.center).toEqual(expected);
            });

            it('should remove the first dimension from the impact', () => {
              const expected: DragImpact = {
                movement: {
                  draggables: [draggable2.id],
                  amount: patch(axis.line, draggable3.page.withMargin[axis.size]),
                  // is still behind where it started
                  isBeyondStartPosition: false,
                },
                direction: axis.direction,
                // is now in the second position
                destination: {
                  droppableId: droppable.id,
                  index: 1,
                },
              };

              expect(result.impact).toEqual(expected);
            });
          });
        });
      });

      describe('jump backward', () => {
        it('should return null if cannot move backward', () => {
          const impact: DragImpact = {
            movement: {
              draggables: [],
              amount: patch(axis.line, draggable1.page.withMargin[axis.size]),
              isBeyondStartPosition: false,
            },
            direction: axis.direction,
            destination: {
              index: 0,
              droppableId: droppable.id,
            },
          };

          const result: ?JumpToNextResult = jumpToNextIndex({
            isMovingForward: false,
            draggableId: draggable1.id,
            impact,
            draggables,
            droppables,
          });

          expect(result).toBe(null);
        });

        describe('is moving towards the start position', () => {
          describe('moving back to original position', () => {
            // dragged the second item (draggable2) forward once, and is now
            // moving backwards towards the start again
            const impact: DragImpact = {
              movement: {
                draggables: [draggable3.id],
                amount: patch(axis.line, draggable2.page.withMargin[axis.size]),
                isBeyondStartPosition: true,
              },
              direction: axis.direction,
              destination: {
                index: 2,
                droppableId: droppable.id,
              },
            };
            const result: ?JumpToNextResult = jumpToNextIndex({
              isMovingForward: false,
              draggableId: draggable2.id,
              impact,
              draggables,
              droppables,
            });

            if (!result) {
              throw new Error('invalid result');
            }

            it('should return the size of the dimension that will move back to its home', () => {
              const expected: Position = patch(
                axis.line,
                // amount is negative because we are moving backwards
                -draggable3.page.withMargin[axis.size],
              );

              expect(result.diff).toEqual(expected);
            });

            it('should return an empty impact', () => {
              const expected: DragImpact = {
                movement: {
                  draggables: [],
                  amount: patch(axis.line, draggable2.page.withMargin[axis.size]),
                  isBeyondStartPosition: false,
                },
                destination: {
                  droppableId: droppable.id,
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
            const impact: DragImpact = {
              movement: {
                draggables: [draggable2.id, draggable3.id],
                amount: patch(axis.line, draggable1.page.withMargin[axis.size]),
                isBeyondStartPosition: true,
              },
              direction: axis.direction,
              destination: {
                index: 2,
                droppableId: droppable.id,
              },
            };
            const result: ?JumpToNextResult = jumpToNextIndex({
              isMovingForward: false,
              draggableId: draggable1.id,
              impact,
              draggables,
              droppables,
            });

            if (!result) {
              throw new Error('invalid result');
            }

            it('should return the size of the dimension that will move back to its home', () => {
              const expected: Position = patch(
                axis.line,
                // amount is negative because we are moving backwards
                -draggable3.page.withMargin[axis.size],
              );

              expect(result.diff).toEqual(expected);
            });

            it('should remove the third draggable from the drag impact', () => {
              const expected: DragImpact = {
                movement: {
                  // draggable3 has been removed
                  draggables: [draggable2.id],
                  amount: patch(axis.line, draggable1.page.withMargin[axis.size]),
                  isBeyondStartPosition: true,
                },
                destination: {
                  droppableId: droppable.id,
                  index: 1,
                },
                direction: axis.direction,
              };

              expect(result.impact).toEqual(expected);
            });
          });
        });

        describe('is moving away from start position', () => {
          describe('dragging the second item back to the first position', () => {
            // no impact yet
            const impact: DragImpact = {
              movement: {
                draggables: [],
                amount: patch(axis.line, draggable2.page.withMargin[axis.size]),
                isBeyondStartPosition: false,
              },
              destination: {
                droppableId: droppable.id,
                index: 1,
              },
              direction: axis.direction,
            };
            const result: ?JumpToNextResult = jumpToNextIndex({
              isMovingForward: false,
              draggableId: draggable2.id,
              impact,
              draggables,
              droppables,
            });

            if (!result) {
              throw new Error('invalid result');
            }

            it('should return negated size of draggable1 as the diff', () => {
              const expected: Position = patch(
                axis.line,
                -draggable1.page.withMargin[axis.size],
              );

              expect(result.diff).toEqual(expected);
            });

            it('should add the first draggable to the drag impact', () => {
              const expected: DragImpact = {
                movement: {
                  draggables: [draggable1.id],
                  amount: patch(axis.line, draggable2.page.withMargin[axis.size]),
                  isBeyondStartPosition: false,
                },
                destination: {
                  droppableId: droppable.id,
                  // is now in the first position
                  index: 0,
                },
                direction: axis.direction,
              };

              expect(result.impact).toEqual(expected);
            });
          });

          describe('dragging the third item back to the second position', () => {
            const impact: DragImpact = {
              movement: {
                draggables: [],
                amount: patch(axis.line, draggable3.page.withMargin[axis.size]),
                isBeyondStartPosition: false,
              },
              destination: {
                droppableId: droppable.id,
                index: 2,
              },
              direction: axis.direction,
            };
            const result: ?JumpToNextResult = jumpToNextIndex({
              isMovingForward: false,
              draggableId: draggable3.id,
              impact,
              draggables,
              droppables,
            });

            if (!result) {
              throw new Error('invalid result');
            }

            it('should return the negated size of draggable2 as the diff', () => {
              const expected: Position = patch(
                axis.line,
                -draggable2.page.withMargin[axis.size],
              );

              expect(result.diff).toEqual(expected);
            });

            it('should add the second draggable to the drag impact', () => {
              const expected: DragImpact = {
                movement: {
                  draggables: [draggable2.id],
                  amount: patch(axis.line, draggable3.page.withMargin[axis.size]),
                  isBeyondStartPosition: false,
                },
                destination: {
                  droppableId: droppable.id,
                  // is now in the second position
                  index: 1,
                },
                direction: axis.direction,
              };

              expect(result.impact).toEqual(expected);
            });
          });
        });
      });
    });
  });
});
