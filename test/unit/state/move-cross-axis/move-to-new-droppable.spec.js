// @flow
import moveToNewDroppable from '../../../../src/state/move-cross-axis/move-to-new-droppable/';
import type { Result } from '../../../../src/state/move-cross-axis/move-cross-axis-types';
import { getDraggableDimension, getDroppableDimension } from '../../../../src/state/dimension';
import getArea from '../../../../src/state/get-area';
import moveToEdge from '../../../../src/state/move-to-edge';
import { patch } from '../../../../src/state/position';
import { horizontal, vertical } from '../../../../src/state/axis';
import { getPreset } from '../../../utils/dimension';
import noImpact from '../../../../src/state/no-impact';
import getViewport from '../../../../src/state/visibility/get-viewport';
import type {
  Axis,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  Position,
} from '../../../../src/types';
import * as logger from '../../../../src/log';

const dontCare: Position = { x: 0, y: 0 };

describe('move to new droppable', () => {
  let loggerError;
  beforeEach(() => {
    loggerError = jest.spyOn(logger, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    loggerError.mockRestore();
  });

  [vertical, horizontal].forEach((axis: Axis) => {
    describe(`on ${axis.direction} axis`, () => {
      const {
        home,
        foreign,
        inHome1,
        inHome2,
        inHome3,
        inHome4,
        inForeign1,
        inForeign2,
        inForeign3,
        inForeign4,
      } = getPreset(axis);

      describe('to home list', () => {
        const draggables: DraggableDimension[] = [
          inHome1, inHome2, inHome3, inHome4,
        ];

        it('should return null and log an error if no target is found', () => {
          // this should never happen but just being safe
          const result: ?Result = moveToNewDroppable({
            pageCenter: dontCare,
            draggable: inHome1,
            target: null,
            destination: home,
            insideDestination: draggables,
            home: {
              index: 0,
              droppableId: home.descriptor.id,
            },
            previousImpact: noImpact,
          });

          expect(result).toBe(null);
          expect(loggerError).toHaveBeenCalled();
        });

        it('should return null and log an error if the target is not inside the droppable', () => {
          const result: ?Result = moveToNewDroppable({
            pageCenter: dontCare,
            draggable: draggables[0],
            target: inForeign1,
            destination: home,
            insideDestination: draggables,
            home: {
              index: 0,
              droppableId: home.descriptor.id,
            },
            previousImpact: noImpact,
          });

          expect(result).toBe(null);
          expect(loggerError).toHaveBeenCalled();
        });

        describe('moving back into original index', () => {
          // the second draggable is moving back into its home
          const result: ?Result = moveToNewDroppable({
            pageCenter: dontCare,
            draggable: inHome2,
            target: inHome2,
            destination: home,
            insideDestination: draggables,
            home: {
              index: 1,
              droppableId: home.descriptor.id,
            },
            previousImpact: noImpact,
          });

          if (!result) {
            throw new Error('invalid test setup');
          }

          it('should return the original center without margin', () => {
            expect(result.pageCenter).toBe(inHome2.page.withoutMargin.center);
            expect(result.pageCenter).not.toEqual(inHome2.page.withMargin.center);
          });

          it('should return an empty impact with the original location', () => {
            const expected: DragImpact = {
              movement: {
                displaced: [],
                amount: patch(axis.line, inHome2.page.withMargin[axis.size]),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                droppableId: home.descriptor.id,
                index: 1,
              },
            };

            expect(result.impact).toEqual(expected);
          });
        });

        describe('moving before the original index', () => {
          // moving inHome4 into the inHome2 position
          const result: ?Result = moveToNewDroppable({
            pageCenter: dontCare,
            draggable: inHome4,
            target: inHome2,
            destination: home,
            insideDestination: draggables,
            home: {
              index: 3,
              droppableId: home.descriptor.id,
            },
            previousImpact: noImpact,
          });

          if (!result) {
            throw new Error('invalid test setup');
          }

          it('should align to the start of the target', () => {
            const expected: Position = moveToEdge({
              source: inHome4.page.withoutMargin,
              sourceEdge: 'start',
              destination: inHome2.page.withMargin,
              destinationEdge: 'start',
              destinationAxis: axis,
            });

            expect(result.pageCenter).toEqual(expected);
          });

          it('should move the everything from the target index to the original index forward', () => {
            const expected: DragImpact = {
              movement: {
                // ordered by closest impacted
                displaced: [
                  {
                    draggableId: inHome2.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                  {
                    draggableId: inHome3.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                ],
                amount: patch(axis.line, inHome4.page.withMargin[axis.size]),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                droppableId: home.descriptor.id,
                // original index of target
                index: 1,
              },
            };

            expect(result.impact).toEqual(expected);
          });
        });

        describe('moving after the original index', () => {
          // moving inHome1 into the inHome4 position
          const result: ?Result = moveToNewDroppable({
            pageCenter: dontCare,
            draggable: inHome1,
            target: inHome4,
            destination: home,
            insideDestination: draggables,
            home: {
              index: 0,
              droppableId: home.descriptor.id,
            },
            previousImpact: noImpact,
          });

          if (!result) {
            throw new Error('invalid test setup');
          }

          describe('center', () => {
            it('should align to the bottom of the target', () => {
              const expected: Position = moveToEdge({
                source: inHome1.page.withoutMargin,
                sourceEdge: 'end',
                destination: inHome4.page.withoutMargin,
                destinationEdge: 'end',
                destinationAxis: axis,
              });

              expect(result.pageCenter).toEqual(expected);
            });
          });

          it('should move the everything from the target index to the original index forward', () => {
            const expected: DragImpact = {
              movement: {
                // ordered by closest impacted
                displaced: [
                  {
                    draggableId: inHome4.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                  {
                    draggableId: inHome3.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                  {
                    draggableId: inHome2.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                ],
                amount: patch(axis.line, inHome1.page.withMargin[axis.size]),
                // is moving beyond start position
                isBeyondStartPosition: true,
              },
              direction: axis.direction,
              destination: {
                droppableId: home.descriptor.id,
                // original index of target
                index: 3,
              },
            };

            expect(result.impact).toEqual(expected);
          });
        });

        describe('visibility and displacement', () => {
          it('should indicate when displacement is not visible when not partially visible in the droppable frame', () => {
            const droppable: DroppableDimension = getDroppableDimension({
              descriptor: {
                id: 'with-frame',
                type: 'TYPE',
              },
              direction: axis.direction,
              client: getArea({
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                [axis.start]: 0,
                // will be cut by frame
                [axis.end]: 200,
              }),
              frameClient: getArea({
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                [axis.start]: 0,
                // will cut the subject
                [axis.end]: 100,
              }),
            });
            const inside: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'inside',
                droppableId: droppable.descriptor.id,
                index: 0,
              },
              client: getArea({
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                [axis.start]: 0,
                [axis.end]: 80,
              }),
            });
            const outside: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'outside',
                droppableId: droppable.descriptor.id,
                index: 1,
              },
              client: getArea({
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                // outside of the frame
                [axis.start]: 110,
                [axis.end]: 120,
              }),
            });
            const customDraggables: DraggableDimension[] = [
              inside, outside,
            ];
            // moving outside back into list with closest being 'outside'
            const expected: DragImpact = {
              movement: {
                displaced: [{
                  draggableId: outside.descriptor.id,
                  isVisible: false,
                  shouldAnimate: false,
                }],
                amount: patch(axis.line, inside.page.withMargin[axis.size]),
                isBeyondStartPosition: true,
              },
              direction: axis.direction,
              // moving into the outside position
              destination: {
                droppableId: droppable.descriptor.id,
                index: outside.descriptor.index,
              },
            };

            const result: ?Result = moveToNewDroppable({
              pageCenter: dontCare,
              draggable: inside,
              target: outside,
              destination: droppable,
              insideDestination: customDraggables,
              home: {
                index: inside.descriptor.index,
                droppableId: droppable.descriptor.id,
              },
              previousImpact: noImpact,
            });

            if (!result || !result.impact) {
              throw new Error('invalid result');
            }

            expect(result.impact).toEqual(expected);
          });

          it('should indicate when displacement is not visible when not partially visible in the viewport', () => {
            const viewport = getViewport();
            const droppable: DroppableDimension = getDroppableDimension({
              descriptor: {
                id: 'with-frame',
                type: 'TYPE',
              },
              direction: axis.direction,
              client: getArea({
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                [axis.start]: 0,
                // extends beyond the viewport
                [axis.end]: viewport[axis.end] + 100,
              }),
            });
            const inside: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'inside',
                droppableId: droppable.descriptor.id,
                index: 0,
              },
              client: getArea({
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                [axis.start]: 0,
                [axis.end]: viewport[axis.end],
              }),
            });
            const outside: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'outside',
                droppableId: droppable.descriptor.id,
                index: 1,
              },
              client: getArea({
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                // outside of the viewport but inside the droppable
                [axis.start]: viewport[axis.end] + 1,
                [axis.end]: viewport[axis.end] + 10,
              }),
            });
            const customDraggables: DraggableDimension[] = [
              inside, outside,
            ];
            // moving outside back into list with closest being 'outside'
            const expected: DragImpact = {
              movement: {
                displaced: [{
                  draggableId: outside.descriptor.id,
                  isVisible: false,
                  shouldAnimate: false,
                }],
                amount: patch(axis.line, inside.page.withMargin[axis.size]),
                isBeyondStartPosition: true,
              },
              direction: axis.direction,
              // moving into the outside position
              destination: {
                droppableId: droppable.descriptor.id,
                index: outside.descriptor.index,
              },
            };

            const result: ?Result = moveToNewDroppable({
              pageCenter: dontCare,
              draggable: inside,
              target: outside,
              destination: droppable,
              insideDestination: customDraggables,
              home: {
                index: inside.descriptor.index,
                droppableId: droppable.descriptor.id,
              },
              previousImpact: noImpact,
            });

            if (!result || !result.impact) {
              throw new Error('invalid result');
            }

            expect(result.impact).toEqual(expected);
          });
        });
      });

      describe('to foreign list', () => {
        const draggables: DraggableDimension[] = [
          inForeign1, inForeign2, inForeign3, inForeign4,
        ];

        it('should return null when the target is not within the list - cannot really happen', () => {
          const result: ?Result = moveToNewDroppable({
            pageCenter: inHome1.page.withMargin.center,
            draggable: inHome1,
            target: inHome2,
            destination: foreign,
            insideDestination: draggables,
            home: {
              index: 0,
              droppableId: home.descriptor.id,
            },
            previousImpact: noImpact,
          });

          expect(result).toBe(null);
        });

        describe('moving into an unpopulated list', () => {
          const result: ?Result = moveToNewDroppable({
            pageCenter: inHome1.page.withMargin.center,
            draggable: inHome1,
            target: null,
            destination: foreign,
            insideDestination: [],
            home: {
              index: 0,
              droppableId: home.descriptor.id,
            },
            previousImpact: noImpact,
          });

          if (!result) {
            throw new Error('invalid test setup');
          }

          it('should move to the start edge of the droppable (including its padding)', () => {
            const expected: Position = moveToEdge({
              source: inHome1.page.withoutMargin,
              sourceEdge: 'start',
              destination: foreign.page.withMarginAndPadding,
              destinationEdge: 'start',
              destinationAxis: foreign.axis,
            });

            expect(result.pageCenter).toEqual(expected);
          });

          it('should return an empty impact', () => {
            const expected: DragImpact = {
              movement: {
                displaced: [],
                amount: patch(foreign.axis.line, inHome1.page.withMargin[foreign.axis.size]),
                isBeyondStartPosition: false,
              },
              direction: foreign.axis.direction,
              destination: {
                droppableId: foreign.descriptor.id,
                index: 0,
              },
            };

            expect(result.impact).toEqual(expected);
          });
        });

        describe('is moving before the target', () => {
          // moving home1 into the second position of the list
          const result: ?Result = moveToNewDroppable({
            pageCenter: inHome1.page.withMargin.center,
            draggable: inHome1,
            target: inForeign2,
            destination: foreign,
            insideDestination: draggables,
            home: {
              index: 0,
              droppableId: home.descriptor.id,
            },
            previousImpact: noImpact,
          });

          if (!result) {
            throw new Error('invalid test setup');
          }

          it('should move before the target', () => {
            const expected: Position = moveToEdge({
              source: inHome1.page.withoutMargin,
              sourceEdge: 'start',
              destination: inForeign2.page.withMargin,
              destinationEdge: 'start',
              destinationAxis: foreign.axis,
            });

            expect(result.pageCenter).toEqual(expected);
          });

          it('should move the target and everything below it forward', () => {
            const expected: DragImpact = {
              movement: {
                // ordered by closest impacted
                displaced: [
                  {
                    draggableId: inForeign2.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                  {
                    draggableId: inForeign3.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                  {
                    draggableId: inForeign4.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                ],
                amount: patch(foreign.axis.line, inHome1.page.withMargin[foreign.axis.size]),
                isBeyondStartPosition: false,
              },
              direction: foreign.axis.direction,
              destination: {
                droppableId: foreign.descriptor.id,
                // index of foreign2
                index: 1,
              },
            };

            expect(result.impact).toEqual(expected);
          });
        });

        describe('is moving after the target', () => {
          // moving home4 into the second position of the foreign list
          const result: ?Result = moveToNewDroppable({
            pageCenter: inHome4.page.withMargin.center,
            draggable: inHome4,
            target: inForeign2,
            destination: foreign,
            insideDestination: draggables,
            home: {
              index: 3,
              droppableId: home.descriptor.id,
            },
            previousImpact: noImpact,
          });

          if (!result) {
            throw new Error('invalid test setup');
          }

          it('should move after the target', () => {
            const expected = moveToEdge({
              source: inHome4.page.withoutMargin,
              sourceEdge: 'start',
              destination: inForeign2.page.withMargin,
              // going after
              destinationEdge: 'end',
              destinationAxis: foreign.axis,
            });

            expect(result.pageCenter).toEqual(expected);
          });

          it('should move everything after the proposed index forward', () => {
            const expected: DragImpact = {
              movement: {
                // ordered by closest impacted
                displaced: [
                  {
                    draggableId: inForeign3.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                  {
                    draggableId: inForeign4.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                ],
                amount: patch(foreign.axis.line, inHome4.page.withMargin[foreign.axis.size]),
                isBeyondStartPosition: false,
              },
              direction: foreign.axis.direction,
              destination: {
                droppableId: foreign.descriptor.id,
                // going after target, so index is target index + 1
                index: 2,
              },
            };

            expect(result.impact).toEqual(expected);
          });
        });

        describe('visibility and displacement', () => {
          it('should indicate when displacement is not visible when not inside droppable frame', () => {
            const customHome: DroppableDimension = getDroppableDimension({
              descriptor: {
                id: 'home',
                type: 'TYPE',
              },
              direction: axis.direction,
              client: getArea({
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                [axis.start]: 0,
                [axis.end]: 100,
              }),
            });
            const customInHome: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'in-home',
                droppableId: customHome.descriptor.id,
                index: 0,
              },
              client: getArea({
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                [axis.start]: 0,
                [axis.end]: 80,
              }),
            });
            const customForeign: DroppableDimension = getDroppableDimension({
              descriptor: {
                id: 'foreign-with-frame',
                type: 'TYPE',
              },
              direction: axis.direction,
              client: getArea({
                top: 0,
                left: 0,
                right: 100,
                // will be cut by frame
                bottom: 200,
              }),
              frameClient: getArea({
                top: 0,
                left: 0,
                right: 100,
                bottom: 100,
              }),
            });

            const customInForeign: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'foreign-outside-frame',
                droppableId: customForeign.descriptor.id,
                index: 0,
              },
              client: getArea({
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                // outside of the foreign frame
                [axis.start]: 110,
                [axis.end]: 120,
              }),
            });

            const customInsideForeign: DraggableDimension[] = [
              customInForeign,
            ];
            // moving outside back into list with closest being 'outside'
            const expected: DragImpact = {
              movement: {
                displaced: [{
                  draggableId: customInForeign.descriptor.id,
                  isVisible: false,
                  shouldAnimate: false,
                }],
                amount: patch(axis.line, customInHome.page.withMargin[axis.size]),
                // always false in foreign list
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              // moving into the outside position
              destination: {
                droppableId: customForeign.descriptor.id,
                index: customInForeign.descriptor.index,
              },
            };

            const result: ?Result = moveToNewDroppable({
              pageCenter: dontCare,
              draggable: customInHome,
              target: customInForeign,
              destination: customForeign,
              insideDestination: customInsideForeign,
              home: {
                index: customInHome.descriptor.index,
                droppableId: customHome.descriptor.id,
              },
              previousImpact: noImpact,
            });

            if (!result || !result.impact) {
              throw new Error('invalid result');
            }

            expect(result.impact).toEqual(expected);
          });

          it('should indicate when displacement is not visible when not inside the viewport', () => {
            const viewport = getViewport();
            const customHome: DroppableDimension = getDroppableDimension({
              descriptor: {
                id: 'home',
                type: 'TYPE',
              },
              direction: axis.direction,
              client: getArea({
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                [axis.start]: 0,
                [axis.end]: 100,
              }),
            });
            const customInHome: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'in-home',
                droppableId: customHome.descriptor.id,
                index: 0,
              },
              client: getArea({
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                [axis.start]: 0,
                [axis.end]: 80,
              }),
            });
            const customForeign: DroppableDimension = getDroppableDimension({
              descriptor: {
                id: 'foreign',
                type: 'TYPE',
              },
              direction: axis.direction,
              client: getArea({
                bottom: viewport.bottom + 100,
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                [axis.start]: 0,
                // extending beyond the viewport
                [axis.end]: viewport[axis.end] + 100,
              }),
            });
            const customInForeign: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'foreign',
                droppableId: customForeign.descriptor.id,
                index: 0,
              },
              client: getArea({
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                // outside of the viewport but inside the droppable
                [axis.start]: viewport[axis.end] + 1,
                [axis.end]: viewport[axis.end] + 10,
              }),
            });

            const customInsideForeign: DraggableDimension[] = [
              customInForeign,
            ];
            // moving outside back into list with closest being 'outside'
            const expected: DragImpact = {
              movement: {
                displaced: [{
                  draggableId: customInForeign.descriptor.id,
                  isVisible: false,
                  shouldAnimate: false,
                }],
                amount: patch(axis.line, customInHome.page.withMargin[axis.size]),
                // always false in foreign list
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              // moving into the outside position
              destination: {
                droppableId: customForeign.descriptor.id,
                index: customInForeign.descriptor.index,
              },
            };

            const result: ?Result = moveToNewDroppable({
              pageCenter: dontCare,
              draggable: customInHome,
              target: customInForeign,
              destination: customForeign,
              insideDestination: customInsideForeign,
              home: {
                index: customInHome.descriptor.index,
                droppableId: customHome.descriptor.id,
              },
              previousImpact: noImpact,
            });

            if (!result || !result.impact) {
              throw new Error('invalid result');
            }

            expect(result.impact).toEqual(expected);
          });
        });
      });
    });
  });
});
