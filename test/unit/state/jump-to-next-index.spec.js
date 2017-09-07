// @flow
import jumpToNextIndex from '../../../src/state/jump-to-next-index/';
import type { Result } from '../../../src/state/jump-to-next-index/jump-to-next-index-types';
import { getDraggableDimension, getDroppableDimension } from '../../../src/state/dimension';
import getClientRect from '../../utils/get-client-rect';
import moveToEdge from '../../../src/state/move-to-edge';
import { patch } from '../../../src/state/position';
import { vertical, horizontal } from '../../../src/state/axis';
import type {
  Axis,
  DragMovement,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DraggableLocation,
  Position,
} from '../../../src/types';

describe('jump to next index', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  [vertical, horizontal].forEach((axis: Axis) => {
    describe(`on the ${axis.direction} axis`, () => {
      const home: DroppableDimension = getDroppableDimension({
        id: 'home',
        direction: axis.direction,
        clientRect: getClientRect({
          top: 0,
          left: 0,
          bottom: 1000,
          right: 1000,
        }),
      });

      // size: 100
      const home1: DraggableDimension = getDraggableDimension({
        id: 'home1',
        droppableId: home.id,
        clientRect: getClientRect({
          top: 0,
          left: 0,
          bottom: 100,
          right: 100,
        }),
      });

      // size: 199
      const home2: DraggableDimension = getDraggableDimension({
        id: 'home2',
        droppableId: home.id,
        clientRect: getClientRect({
          top: 101,
          left: 101,
          bottom: 300,
          right: 300,
        }),
      });

      // size: 299
      const home3: DraggableDimension = getDraggableDimension({
        id: 'home3',
        droppableId: home.id,
        clientRect: getClientRect({
          top: 301,
          left: 301,
          bottom: 600,
          right: 600,
        }),
      });

      // foreign droppable
      const foreign: DroppableDimension = getDroppableDimension({
        id: 'foreign',
        direction: axis.direction,
        clientRect: getClientRect({
          top: 1001,
          left: 1001,
          bottom: 2000,
          right: 2000,
        }),
      });

      // size: 99
      const foreign1: DraggableDimension = getDraggableDimension({
        id: 'foreign1',
        droppableId: foreign.id,
        clientRect: getClientRect({
          top: 1001,
          left: 1001,
          bottom: 1100,
          right: 1100,
        }),
      });

      // size: 199
      const foreign2: DraggableDimension = getDraggableDimension({
        id: 'foreign2',
        droppableId: foreign.id,
        clientRect: getClientRect({
          top: 1101,
          left: 1101,
          bottom: 1300,
          right: 1300,
        }),
      });

      // size: 299
      const foreign3: DraggableDimension = getDraggableDimension({
        id: 'foreign3',
        droppableId: foreign.id,
        clientRect: getClientRect({
          top: 1301,
          left: 1301,
          bottom: 1600,
          right: 1600,
        }),
      });

      const draggables: DraggableDimensionMap = {
        [home1.id]: home1,
        [home2.id]: home2,
        [home3.id]: home3,
        [foreign1.id]: foreign1,
        [foreign2.id]: foreign2,
        [foreign3.id]: foreign3,
      };

      it('should return null if there was no previous destination', () => {
        const impact: DragImpact = {
          movement: {
            draggables: [],
            amount: patch(axis.line, home1.page.withMargin[axis.size]),
            isBeyondStartPosition: false,
          },
          direction: axis.direction,
          // no previous destination - should not happen when dragging with a keyboard
          destination: null,
        };

        const result1: ?Result = jumpToNextIndex({
          isMovingForward: true,
          draggableId: home1.id,
          impact,
          droppable: foreign,
          draggables,
        });

        expect(result1).toEqual(null);
        expect(console.error).toHaveBeenCalledTimes(1);

        const result2: ?Result = jumpToNextIndex({
          isMovingForward: true,
          draggableId: home1.id,
          impact,
          droppable: foreign,
          draggables,
        });

        expect(result2).toEqual(null);
        expect(console.error).toHaveBeenCalledTimes(2);
      });

      describe('in home list', () => {
        describe('moving forwards', () => {
          it('should return null if cannot move forward', () => {
            const impact: DragImpact = {
              movement: {
                draggables: [],
                amount: patch(axis.line, home1.page.withMargin[axis.size]),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                index: 2,
                droppableId: home.id,
              },
            };

            const result: ?Result = jumpToNextIndex({
              isMovingForward: true,
              draggableId: home3.id,
              impact,
              droppable: home,
              draggables,
            });

            expect(result).toBe(null);
          });

          describe('is moving away from start position', () => {
            describe('dragging first item forward one position', () => {
              // dragging the first item forward into the second position
              const movement: DragMovement = {
                draggables: [],
                amount: patch(axis.line, home1.page.withMargin[axis.size]),
                isBeyondStartPosition: false,
              };
              const destination: DraggableLocation = {
                index: 0,
                droppableId: home.id,
              };
              const impact: DragImpact = {
                movement,
                direction: axis.direction,
                destination,
              };
              const result: ?Result = jumpToNextIndex({
                isMovingForward: true,
                draggableId: home1.id,
                impact,
                draggables,
                droppable: home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the end of the dragging item to the end of the next item', () => {
                const expected: Position = moveToEdge({
                  source: home1.page.withoutMargin,
                  sourceEdge: 'end',
                  destination: home2.page.withoutMargin,
                  destinationEdge: 'end',
                  destinationAxis: axis,
                });

                expect(result.pageCenter).toEqual(expected);
              });

              it('should move the item into the second spot and move the second item out of the way', () => {
                const expected: DragImpact = {
                  movement: {
                    draggables: [home2.id],
                    amount: patch(axis.line, home1.page.withMargin[axis.size]),
                    isBeyondStartPosition: true,
                  },
                  direction: axis.direction,
                  // is now in the second position
                  destination: {
                    droppableId: home.id,
                    index: 1,
                  },
                };

                expect(result.impact).toEqual(expected);
              });
            });

            describe('dragging second item forward one position', () => {
              const movement: DragMovement = {
                draggables: [],
                amount: patch(axis.line, home2.page.withMargin[axis.size]),
                isBeyondStartPosition: false,
              };
              const destination: DraggableLocation = {
                index: 1,
                droppableId: home.id,
              };
              const impact: DragImpact = {
                movement,
                direction: axis.direction,
                destination,
              };
              const result: ?Result = jumpToNextIndex({
                isMovingForward: true,
                draggableId: home2.id,
                impact,
                draggables,
                droppable: home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the end of the dragging item to the end of the next item', () => {
                const expected: Position = moveToEdge({
                  source: home2.page.withoutMargin,
                  sourceEdge: 'end',
                  destination: home3.page.withoutMargin,
                  destinationEdge: 'end',
                  destinationAxis: axis,
                });

                expect(result.pageCenter).toEqual(expected);
              });

              it('should move the dragging item into the third spot and move the third item out of the way', () => {
                const expected: DragImpact = {
                  movement: {
                    draggables: [home3.id],
                    amount: patch(axis.line, home2.page.withMargin[axis.size]),
                    isBeyondStartPosition: true,
                  },
                  direction: axis.direction,
                  // is now in the second position
                  destination: {
                    droppableId: home.id,
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
                  draggables: [home2.id],
                  amount: patch(axis.line, home1.page.withMargin[axis.size]),
                  isBeyondStartPosition: true,
                },
                direction: axis.direction,
                // draggable1 is now in the second position
                destination: {
                  droppableId: home.id,
                  index: 1,
                },
              };
              const result: ?Result = jumpToNextIndex({
                isMovingForward: true,
                draggableId: home1.id,
                impact,
                draggables,
                droppable: home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the end of the dragging item to the end of the next item', () => {
                // next dimension from the current index is draggable3
                const expected: Position = moveToEdge({
                  source: home1.page.withoutMargin,
                  sourceEdge: 'end',
                  destination: home3.page.withoutMargin,
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
                    draggables: [home3.id, home2.id],
                    amount: patch(axis.line, home1.page.withMargin[axis.size]),
                    isBeyondStartPosition: true,
                  },
                  direction: axis.direction,
                  // is now in the second position
                  destination: {
                    droppableId: home.id,
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
                  draggables: [home1.id],
                  amount: patch(axis.line, home2.page.withMargin[axis.size]),
                  isBeyondStartPosition: false,
                },
                direction: axis.direction,
                destination: {
                  index: 0,
                  droppableId: home.id,
                },
              };
              const result: ?Result = jumpToNextIndex({
                isMovingForward: true,
                draggableId: home2.id,
                impact,
                draggables,
                droppable: home,
              });

              if (!result) {
                throw new Error('invalid result of jumpToNextIndex');
              }

              it('should move the start of the dragging item to the end of the previous item (which its original position)', () => {
                const expected: Position = moveToEdge({
                  source: home2.page.withoutMargin,
                  sourceEdge: 'start',
                  destination: home2.page.withoutMargin,
                  destinationEdge: 'start',
                  destinationAxis: axis,
                });

                expect(result.pageCenter).toEqual(expected);
                // is now back at its original position
                expect(result.pageCenter).toEqual(home2.page.withoutMargin.center);
              });

              it('should return an empty impact', () => {
                const expected: DragImpact = {
                  movement: {
                    draggables: [],
                    amount: patch(axis.line, home2.page.withMargin[axis.size]),
                    isBeyondStartPosition: false,
                  },
                  destination: {
                    droppableId: home.id,
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
                  // sorted by the draggable that is closest to where the dragging item is
                  draggables: [home1.id, home2.id],
                  amount: patch(axis.line, home3.page.withMargin[axis.size]),
                  isBeyondStartPosition: true,
                },
                direction: axis.direction,
                // draggable3 is now in the first position
                destination: {
                  droppableId: home.id,
                  index: 0,
                },
              };
              // moving draggable3 forward one position
              const result: ?Result = jumpToNextIndex({
                isMovingForward: true,
                draggableId: home3.id,
                impact,
                draggables,
                droppable: home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move to the start of the draggable item to the start position of the destination draggable', () => {
                const expected: Position = moveToEdge({
                  source: home3.page.withoutMargin,
                  sourceEdge: 'start',
                  destination: home2.page.withoutMargin,
                  destinationEdge: 'start',
                  destinationAxis: axis,
                });

                expect(result.pageCenter).toEqual(expected);
              });

              it('should remove the first dimension from the impact', () => {
                const expected: DragImpact = {
                  movement: {
                    draggables: [home2.id],
                    amount: patch(axis.line, home3.page.withMargin[axis.size]),
                    // is still behind where it started
                    isBeyondStartPosition: false,
                  },
                  direction: axis.direction,
                  // is now in the second position
                  destination: {
                    droppableId: home.id,
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
            const impact: DragImpact = {
              movement: {
                draggables: [],
                amount: patch(axis.line, home1.page.withMargin[axis.size]),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                index: 0,
                droppableId: home.id,
              },
            };

            const result: ?Result = jumpToNextIndex({
              isMovingForward: false,
              draggableId: home1.id,
              impact,
              draggables,
              droppable: home,
            });

            expect(result).toBe(null);
          });

          describe('is moving away from start position', () => {
            describe('dragging the second item back to the first position', () => {
              // no impact yet
              const impact: DragImpact = {
                movement: {
                  draggables: [],
                  amount: patch(axis.line, home2.page.withMargin[axis.size]),
                  isBeyondStartPosition: false,
                },
                destination: {
                  droppableId: home.id,
                  index: 1,
                },
                direction: axis.direction,
              };
              const result: ?Result = jumpToNextIndex({
                isMovingForward: false,
                draggableId: home2.id,
                impact,
                draggables,
                droppable: home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the start of the draggable to the start of the previous draggable', () => {
                const expected: Position = moveToEdge({
                  source: home2.page.withoutMargin,
                  sourceEdge: 'start',
                  destination: home1.page.withoutMargin,
                  destinationEdge: 'start',
                  destinationAxis: axis,
                });

                expect(result.pageCenter).toEqual(expected);
              });

              it('should add the first draggable to the drag impact', () => {
                const expected: DragImpact = {
                  movement: {
                    draggables: [home1.id],
                    amount: patch(axis.line, home2.page.withMargin[axis.size]),
                    isBeyondStartPosition: false,
                  },
                  destination: {
                    droppableId: home.id,
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
                  amount: patch(axis.line, home3.page.withMargin[axis.size]),
                  isBeyondStartPosition: false,
                },
                destination: {
                  droppableId: home.id,
                  index: 2,
                },
                direction: axis.direction,
              };
              const result: ?Result = jumpToNextIndex({
                isMovingForward: false,
                draggableId: home3.id,
                impact,
                draggables,
                droppable: home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the start of the draggable to the start of the previous draggable', () => {
                const expected: Position = moveToEdge({
                  source: home3.page.withoutMargin,
                  sourceEdge: 'start',
                  destination: home2.page.withoutMargin,
                  destinationEdge: 'start',
                  destinationAxis: axis,
                });

                expect(result.pageCenter).toEqual(expected);
              });

              it('should add the second draggable to the drag impact', () => {
                const expected: DragImpact = {
                  movement: {
                    draggables: [home2.id],
                    amount: patch(axis.line, home3.page.withMargin[axis.size]),
                    isBeyondStartPosition: false,
                  },
                  destination: {
                    droppableId: home.id,
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
              const impact: DragImpact = {
                movement: {
                  draggables: [home3.id],
                  amount: patch(axis.line, home2.page.withMargin[axis.size]),
                  isBeyondStartPosition: true,
                },
                direction: axis.direction,
                destination: {
                  index: 2,
                  droppableId: home.id,
                },
              };
              const result: ?Result = jumpToNextIndex({
                isMovingForward: false,
                draggableId: home2.id,
                impact,
                draggables,
                droppable: home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the end of the draggable to the end of the next draggable (which is its original position)', () => {
                const expected: Position = moveToEdge({
                  source: home2.page.withoutMargin,
                  sourceEdge: 'end',
                  // destination is itself as moving back to home
                  destination: home2.page.withoutMargin,
                  destinationEdge: 'end',
                  destinationAxis: axis,
                });

                expect(result.pageCenter).toEqual(expected);
                // moved back to its original position
                expect(result.pageCenter).toEqual(home2.page.withoutMargin.center);
              });

              it('should return an empty impact', () => {
                const expected: DragImpact = {
                  movement: {
                    draggables: [],
                    amount: patch(axis.line, home2.page.withMargin[axis.size]),
                    isBeyondStartPosition: false,
                  },
                  destination: {
                    droppableId: home.id,
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
                  // sorted by closest to where the draggable currently is
                  draggables: [home3.id, home2.id],
                  amount: patch(axis.line, home1.page.withMargin[axis.size]),
                  isBeyondStartPosition: true,
                },
                direction: axis.direction,
                destination: {
                  index: 2,
                  droppableId: home.id,
                },
              };
              const result: ?Result = jumpToNextIndex({
                isMovingForward: false,
                draggableId: home1.id,
                impact,
                draggables,
                droppable: home,
              });

              if (!result) {
                throw new Error('invalid result');
              }

              it('should move the end of the draggable to the end of the previous draggable', () => {
                const expected: Position = moveToEdge({
                  source: home1.page.withoutMargin,
                  sourceEdge: 'end',
                  destination: home2.page.withoutMargin,
                  destinationEdge: 'end',
                  destinationAxis: axis,
                });

                expect(result.pageCenter).toEqual(expected);
              });

              it('should remove the third draggable from the drag impact', () => {
                const expected: DragImpact = {
                  movement: {
                    // draggable3 has been removed
                    draggables: [home2.id],
                    amount: patch(axis.line, home1.page.withMargin[axis.size]),
                    isBeyondStartPosition: true,
                  },
                  destination: {
                    droppableId: home.id,
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

      describe('in foreign list', () => {
        describe('moving forwards', () => {
          describe('moving forward one position', () => {
            // moved home1 into the first position of the foreign list
            const impact: DragImpact = {
              movement: {
                // Ordered by the closest impacted.
                // Because we have moved into the first position it will be ordered 1-2-3
                draggables: [foreign1.id, foreign2.id, foreign3.id],
                amount: patch(axis.line, home1.page.withMargin[axis.size]),
                // Always false when in another list
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                // it is now in the foreign droppable in the first position
                droppableId: foreign.id,
                index: 0,
              },
            };

            const result: ?Result = jumpToNextIndex({
              isMovingForward: true,
              draggableId: home1.id,
              impact,
              droppable: foreign,
              draggables,
            });

            if (!result) {
              throw new Error('invalid test setup');
            }

            it('should move to the start edge of the dragging item to the start of foreign2', () => {
              const expected = moveToEdge({
                source: home1.page.withoutMargin,
                sourceEdge: 'start',
                destination: foreign2.page.withMargin,
                destinationEdge: 'start',
                destinationAxis: foreign.axis,
              });

              expect(result.pageCenter).toEqual(expected);
            });

            it('should remove foreign1 when moving forward', () => {
              const expected: DragImpact = {
                movement: {
                  draggables: [foreign2.id, foreign3.id],
                  amount: patch(axis.line, home1.page.withMargin[axis.size]),
                  isBeyondStartPosition: false,
                },
                direction: axis.direction,
                destination: {
                  droppableId: foreign.id,
                  index: 1,
                },
              };

              expect(result.impact).toEqual(expected);
            });
          });

          describe('moving into last position of the list', () => {
            // moved home1 into the second last position of the list
            const impact: DragImpact = {
              movement: {
                // Ordered by the closest impacted.
                draggables: [foreign3.id],
                amount: patch(axis.line, home1.page.withMargin[axis.size]),
                // Always false when in another list
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                // it is now in the foreign droppable in the third position
                droppableId: foreign.id,
                index: 2,
              },
            };

            const result: ?Result = jumpToNextIndex({
              isMovingForward: true,
              draggableId: home1.id,
              impact,
              droppable: foreign,
              draggables,
            });

            if (!result) {
              throw new Error('invalid test setup');
            }

            it('should move to the start edge of the dragging item to the end of foreign1', () => {
              const expected = moveToEdge({
                source: home1.page.withoutMargin,
                sourceEdge: 'start',
                destination: foreign3.page.withMargin,
                destinationEdge: 'end',
                destinationAxis: foreign.axis,
              });

              expect(result.pageCenter).toEqual(expected);
            });

            it('should remove foreign3 when moving forward', () => {
              const expected: DragImpact = {
                movement: {
                  draggables: [],
                  amount: patch(axis.line, home1.page.withMargin[axis.size]),
                  isBeyondStartPosition: false,
                },
                direction: axis.direction,
                destination: {
                  droppableId: foreign.id,
                  // bigger than the original list - in the forth position
                  index: 3,
                },
              };

              expect(result.impact).toEqual(expected);
            });
          });

          it('should return null if attempting to move beyond end of the list', () => {
            // home1 is now in the last position of the list
            const impact: DragImpact = {
              movement: {
                draggables: [],
                amount: patch(axis.line, home1.page.withMargin[axis.size]),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                droppableId: foreign.id,
                // bigger than the original list - in the forth position
                index: 3,
              },
            };

            const result: ?Result = jumpToNextIndex({
              isMovingForward: true,
              draggableId: home1.id,
              impact,
              droppable: foreign,
              draggables,
            });

            expect(result).toBe(null);
          });
        });

        describe('moving backwards', () => {
          it('should return null if attempting to move backwards beyond the start of the list', () => {
            // moved home1 into the first position of the foreign list
            const impact: DragImpact = {
              movement: {
                // Ordered by the closest impacted.
                // Because we have moved into the first position it will be ordered 1-2-3
                draggables: [foreign1.id, foreign2.id, foreign3.id],
                amount: patch(axis.line, home1.page.withMargin[axis.size]),
                // Always false when in another list
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                // it is now in the foreign droppable in the first position
                droppableId: foreign.id,
                index: 0,
              },
            };

            const result: ?Result = jumpToNextIndex({
              isMovingForward: false,
              draggableId: home1.id,
              impact,
              droppable: foreign,
              draggables,
            });

            expect(result).toBe(null);
          });

          describe('moving backwards one position in list', () => {
            // home1 is in the third position for foreign (one before the last)
            const impact: DragImpact = {
              movement: {
                // Ordered by the closest impacted.
                draggables: [foreign3.id],
                amount: patch(axis.line, home1.page.withMargin[axis.size]),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                droppableId: foreign.id,
                index: 2,
              },
            };

            const result: ?Result = jumpToNextIndex({
              isMovingForward: false,
              draggableId: home1.id,
              impact,
              droppable: foreign,
              draggables,
            });

            if (!result) {
              throw new Error('invalid test setup');
            }

            it('should move to the start edge of foreign2', () => {
              const expected: Position = moveToEdge({
                source: home1.page.withoutMargin,
                sourceEdge: 'start',
                destination: foreign2.page.withoutMargin,
                destinationEdge: 'start',
                destinationAxis: axis,
              });

              expect(result.pageCenter).toEqual(expected);
            });

            it('should add foreign2 to the drag impact', () => {
              const expected: DragImpact = {
                movement: {
                  // Ordered by the closest impacted.
                  draggables: [foreign2.id, foreign3.id],
                  amount: patch(axis.line, home1.page.withMargin[axis.size]),
                  isBeyondStartPosition: false,
                },
                direction: axis.direction,
                destination: {
                  droppableId: foreign.id,
                  // moved backwards
                  index: 1,
                },
              };

              expect(result.impact).toEqual(expected);
            });
          });

          describe('moving backwards into the first position of the list', () => {
            // currently home1 is in the second position in front of foreign1
            const impact: DragImpact = {
              movement: {
                // Ordered by the closest impacted.
                draggables: [foreign2.id, foreign3.id],
                amount: patch(axis.line, home1.page.withMargin[axis.size]),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                droppableId: foreign.id,
                index: 1,
              },
            };

            const result: ?Result = jumpToNextIndex({
              isMovingForward: false,
              draggableId: home1.id,
              impact,
              droppable: foreign,
              draggables,
            });

            if (!result) {
              throw new Error('invalid test setup');
            }

            it('should move the start edge of home1 to the start edge of foreign1', () => {
              const expected: Position = moveToEdge({
                source: home1.page.withoutMargin,
                sourceEdge: 'start',
                destination: foreign1.page.withoutMargin,
                destinationEdge: 'start',
                destinationAxis: axis,
              });

              expect(result.pageCenter).toEqual(expected);
            });

            it('should add foreign1 to the impact', () => {
              const expected: DragImpact = {
                movement: {
                  draggables: [foreign1.id, foreign2.id, foreign3.id],
                  amount: patch(axis.line, home1.page.withMargin[axis.size]),
                  isBeyondStartPosition: false,
                },
                direction: axis.direction,
                destination: {
                  droppableId: foreign.id,
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
