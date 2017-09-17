// @flow
// eslint-disable-next-line no-duplicate-imports
import getDragImpact from '../../../src/state/get-drag-impact';
import noImpact from '../../../src/state/no-impact';
import { add, patch, subtract } from '../../../src/state/position';
import { vertical, horizontal } from '../../../src/state/axis';
import {
  getPreset,
  updateDroppableScroll,
} from '../../utils/dimension';
import type {
  Axis,
  DroppableId,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DragImpact,
  Position,
  Spacing,
} from '../../../src/types';

describe('get drag impact', () => {
  [vertical, horizontal].forEach((axis: Axis) => {
    describe(`on ${axis.direction} axis`, () => {
      const {
        home,
        inHome1,
        inHome2,
        inHome3,
        inHome4,
        foreign,
        inForeign1,
        inForeign2,
        inForeign3,
        inForeign4,
        droppables,
        draggables,
      } = getPreset(axis);

      it('should return no impact when not dragging over anything', () => {
        // dragging up above the list
        const farAway: Position = {
          x: 1000,
          y: 1000,
        };

        const impact: DragImpact = getDragImpact({
          pageCenter: farAway,
          draggable: inHome1,
          draggables,
          droppables,
        });

        expect(impact).toEqual(noImpact);
      });

      it('should return no impact when moving over a disabled list', () => {

      });

      describe('moving over home list', () => {
        // moving inHome1 no where
        describe('moving over original position', () => {
          it('should return no impact', () => {
            const pageCenter: Position = inHome1.page.withoutMargin.center;
            const expected: DragImpact = {
              movement: {
                amount: patch(axis.line, inHome1.page.withMargin[axis.size]),
                draggables: [],
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                droppableId: home.id,
                index: 0,
              },
            };

            const impact: DragImpact = getDragImpact({
              pageCenter,
              draggable: inHome1,
              draggables,
              droppables,
            });

            expect(impact).toEqual(expected);
          });
        });

        // moving inHome1 forward towards but not past inHome2
        describe('have not moved enough to impact others', () => {
          it('should return no impact', () => {
            const pageCenter: Position = patch(
              axis.line,
              // up to the line but not over it
              inHome2.page.withoutMargin[axis.start],
              // no movement on cross axis
              inHome1.page.withoutMargin.center[axis.crossLine],
            );
            const expected: DragImpact = {
              movement: {
                amount: patch(axis.line, inHome1.page.withMargin[axis.size]),
                draggables: [],
                isBeyondStartPosition: true,
              },
              direction: axis.direction,
              destination: {
                droppableId: home.id,
                index: 0,
              },
            };

            const impact: DragImpact = getDragImpact({
              pageCenter,
              draggable: inHome1,
              draggables,
              droppables,
            });

            expect(impact).toEqual(expected);
          });
        });

        // moving inHome2 forwards past inHome4
        describe('moving beyond start position', () => {
          const pageCenter: Position = patch(
            axis.line,
            inHome4.page.withoutMargin[axis.start] + 1,
            // no change
            inHome2.page.withoutMargin.center[axis.crossLine],
          );
          const expected: DragImpact = {
            movement: {
              amount: patch(axis.line, inHome2.page.withMargin[axis.size]),
              // ordered by closest to current location
              draggables: [inHome4.id, inHome3.id],
              isBeyondStartPosition: true,
            },
            direction: axis.direction,
            destination: {
              droppableId: home.id,
              // is now after inHome4
              index: 3,
            },
          };

          const impact: DragImpact = getDragImpact({
            pageCenter,
            draggable: inHome2,
            draggables,
            droppables,
          });

          expect(impact).toEqual(expected);
        });

        // moving inHome3 back past inHome1
        describe('moving back past start position', () => {
          it('should move into the correct position', () => {
            const pageCenter: Position = patch(
              axis.line,
              inHome1.page.withoutMargin[axis.end] - 1,
              // no change
              inHome3.page.withoutMargin.center[axis.crossLine],
            );

            const expected: DragImpact = {
              movement: {
                amount: patch(axis.line, inHome3.page.withMargin[axis.size]),
                // ordered by closest to current location
                draggables: [inHome1.id, inHome2.id],
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                droppableId: home.id,
                // is now before inHome1
                index: 0,
              },
            };

            const impact: DragImpact = getDragImpact({
              pageCenter,
              draggable: inHome3,
              draggables,
              droppables,
            });

            expect(impact).toEqual(expected);
          });
        });

        describe('home droppable is scrolled', () => {

        });

        describe('home droppable scroll has changed during a drag', () => {
          // moving inHome1 past inHome2 by scrolling the dimension
          describe('moving beyond start position with own scroll', () => {
            it('should move past other draggables', () => {
              // the middle of the target edge
              const startOfInHome2: Position = patch(
                axis.line,
                inHome2.page.withoutMargin[axis.start],
                inHome2.page.withoutMargin.center[axis.crossLine],
              );
              const distanceNeeded: Position = add(
                subtract(startOfInHome2, inHome1.page.withoutMargin.center),
                // need to move over the edge
                patch(axis.line, 1),
              );
              const homeWithScroll: DroppableDimension = updateDroppableScroll(
                home, distanceNeeded
              );
              const updatedDroppables: DroppableDimensionMap = {
                ...droppables,
                [home.id]: homeWithScroll,
              };
              // no changes in current page center from original
              const pageCenter: Position = inHome1.page.withoutMargin.center;
              const expected: DragImpact = {
                movement: {
                  amount: patch(axis.line, inHome1.page.withMargin[axis.size]),
                  // ordered by closest to current location
                  draggables: [inHome2.id],
                  isBeyondStartPosition: true,
                },
                direction: axis.direction,
                destination: {
                  droppableId: home.id,
                  // is now after inHome2
                  index: 1,
                },
              };

              const impact: DragImpact = getDragImpact({
                pageCenter,
                draggable: inHome1,
                draggables,
                droppables: updatedDroppables,
              });

              expect(impact).toEqual(expected);
            });
          });

          // moving inHome4 back past inHome2
          describe('moving back past start position with own scroll', () => {
            it('should move back past inHome2', () => {
              // the middle of the target edge
              const endOfInHome2: Position = patch(
                axis.line,
                inHome2.page.withoutMargin[axis.end],
                inHome2.page.withoutMargin.center[axis.crossLine],
              );
              const distanceNeeded: Position = add(
                subtract(endOfInHome2, inHome4.page.withoutMargin.center),
                // need to move over the edge
                patch(axis.line, -1),
              );
              const homeWithScroll: DroppableDimension = updateDroppableScroll(
                home, distanceNeeded
              );
              const updatedDroppables: DroppableDimensionMap = {
                ...droppables,
                [home.id]: homeWithScroll,
              };
              // no changes in current page center from original
              const pageCenter: Position = inHome4.page.withoutMargin.center;
              const expected: DragImpact = {
                movement: {
                  amount: patch(axis.line, inHome4.page.withMargin[axis.size]),
                // ordered by closest to current location
                  draggables: [inHome2.id, inHome3.id],
                  isBeyondStartPosition: false,
                },
                direction: axis.direction,
                destination: {
                  droppableId: home.id,
                // is now before inHome2
                  index: 1,
                },
              };

              const impact: DragImpact = getDragImpact({
                pageCenter,
                draggable: inHome4,
                draggables,
                droppables: updatedDroppables,
              });

              expect(impact).toEqual(expected);
            });
          });
        });
      });

      describe('moving into foreign list', () => {
        // moving inHome1 above inForeign1
        describe('moving into the start of a populated droppable', () => {
          it('should move everything in the foreign list forward', () => {
            const pageCenter: Position = patch(
              axis.line,
              inForeign1.page.withoutMargin[axis.start] + 1,
              inForeign1.page.withoutMargin.center[axis.crossLine],
            );
            const expected: DragImpact = {
              movement: {
                amount: patch(axis.line, inHome1.page.withMargin[axis.size]),
                // ordered by closest to current location
                draggables: [inForeign1.id, inForeign2.id, inForeign3.id, inForeign4.id],
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                // now in a different droppable
                droppableId: foreign.id,
                // is now before inForeign1
                index: 0,
              },
            };

            const impact: DragImpact = getDragImpact({
              pageCenter,
              draggable: inHome1,
              draggables,
              droppables,
            });

            expect(impact).toEqual(expected);
          });
        });

        describe('moving into the middle of a populated droppable', () => {

        });

        describe('moving into the end of a populated dropppable', () => {

        });

        describe('moving to an empty droppable', () => {

        });

        describe('home droppable is scrolled', () => {

        });

        describe('destination droppable is scrolled', () => {

        });
      });
    });
  });
});
