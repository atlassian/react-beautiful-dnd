// @flow
import moveToNewDroppable from '../../../../src/state/move-cross-axis/move-to-new-droppable/';
import type { Result } from '../../../../src/state/move-cross-axis/move-cross-axis-types';
import { getDraggableDimension } from '../../../../src/state/dimension';
import getClientRect from '../../../../src/state/get-client-rect';
import moveToEdge from '../../../../src/state/move-to-edge';
import { patch } from '../../../../src/state/position';
import { horizontal, vertical } from '../../../../src/state/axis';
import { getPreset } from '../../../utils/dimension';
import type {
  Axis,
  DragImpact,
  DraggableDimension,
  Position,
} from '../../../../src/types';

describe('move to new droppable', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    console.error.mockRestore();
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
        const dontCare: Position = { x: 0, y: 0 };
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
              droppableId: home.id,
            },
          });

          expect(result).toBe(null);
          expect(console.error).toHaveBeenCalled();
        });

        it('should return null and log an error if the target is not inside the droppable', () => {
          const invalid: DraggableDimension = getDraggableDimension({
            id: 'invalid',
            droppableId: 'some-other-droppable',
            clientRect: getClientRect({
              top: 1000,
              left: 1000,
              bottom: 1100,
              right: 1100,
            }),
          });
          const result: ?Result = moveToNewDroppable({
            pageCenter: dontCare,
            draggable: draggables[0],
            target: invalid,
            destination: home,
            insideDestination: draggables,
            home: {
              index: 0,
              droppableId: home.id,
            },
          });

          expect(result).toBe(null);
          expect(console.error).toHaveBeenCalled();
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
              droppableId: home.id,
            },
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
                draggables: [],
                amount: patch(axis.line, inHome2.page.withMargin[axis.size]),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                droppableId: home.id,
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
              droppableId: home.id,
            },
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
                draggables: [inHome2.id, inHome3.id],
                amount: patch(axis.line, inHome4.page.withMargin[axis.size]),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                droppableId: home.id,
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
              droppableId: home.id,
            },
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
                draggables: [inHome4.id, inHome3.id, inHome2.id],
                amount: patch(axis.line, inHome1.page.withMargin[axis.size]),
                // is moving beyond start position
                isBeyondStartPosition: true,
              },
              direction: axis.direction,
              destination: {
                droppableId: home.id,
                // original index of target
                index: 3,
              },
            };

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
              droppableId: home.id,
            },
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
              droppableId: home.id,
            },
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
                draggables: [],
                amount: patch(foreign.axis.line, inHome1.page.withMargin[foreign.axis.size]),
                isBeyondStartPosition: false,
              },
              direction: foreign.axis.direction,
              destination: {
                droppableId: foreign.id,
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
              droppableId: home.id,
            },
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
                draggables: [inForeign2.id, inForeign3.id, inForeign4.id],
                amount: patch(foreign.axis.line, inHome1.page.withMargin[foreign.axis.size]),
                isBeyondStartPosition: false,
              },
              direction: foreign.axis.direction,
              destination: {
                droppableId: foreign.id,
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
              droppableId: home.id,
            },
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
                draggables: [inForeign3.id, inForeign4.id],
                amount: patch(foreign.axis.line, inHome4.page.withMargin[foreign.axis.size]),
                isBeyondStartPosition: false,
              },
              direction: foreign.axis.direction,
              destination: {
                droppableId: foreign.id,
                // going after target, so index is target index + 1
                index: 2,
              },
            };

            expect(result.impact).toEqual(expected);
          });
        });
      });
    });
  });
});
