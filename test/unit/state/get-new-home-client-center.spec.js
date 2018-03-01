// @flow
import getNewHomeClientCenter from '../../../src/state/get-new-home-client-center';
import { noMovement } from '../../../src/state/no-impact';
import { patch } from '../../../src/state/position';
import { vertical, horizontal } from '../../../src/state/axis';
import moveToEdge from '../../../src/state/move-to-edge';
import { getPreset } from '../../utils/dimension';
import type {
  Axis,
  DragMovement,
  Position,
} from '../../../src/types';

describe('get new home client center', () => {
  [vertical, horizontal].forEach((axis: Axis) => {
    describe(`dropping on ${axis.direction} list`, () => {
      const {
        home,
        inHome1,
        inHome2,
        inHome3,
        foreign,
        inForeign1,
        inForeign2,
        inForeign3,
        inForeign4,
        emptyForeign,
        draggables,
      } = getPreset(axis);

      const inHome1Size: Position = patch(axis.line, inHome1.page.marginBox[axis.size]);

      it('should return the original center dropped on no destination', () => {
        const result: Position = getNewHomeClientCenter({
          movement: noMovement,
          draggables,
          draggable: inHome1,
          destination: null,
        });

        expect(result).toEqual(inHome1.client.marginBox.center);
      });

      describe('dropping in home list', () => {
        it('should return the original center if moving back into the same spot', () => {
          const newCenter: Position = getNewHomeClientCenter({
            movement: noMovement,
            draggables,
            draggable: inHome1,
            destination: home,
          });

          expect(newCenter).toEqual(inHome1.client.marginBox.center);
        });

        describe('is moving forward (is always beyond start position)', () => {
          // moving the first item forward past the third item
          it('should move after the closest impacted draggable', () => {
            const targetCenter: Position = moveToEdge({
              source: inHome1.client.marginBox,
              sourceEdge: 'end',
              destination: inHome3.client.marginBox,
              destinationEdge: 'end',
              destinationAxis: axis,
            });
            // the movement from the last drag
            const movement: DragMovement = {
              // ordered by closest to impacted
              displaced: [
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
              amount: inHome1Size,
              isBeyondStartPosition: true,
            };

            const newCenter = getNewHomeClientCenter({
              movement,
              draggables,
              draggable: inHome1,
              destination: home,
            });

            expect(newCenter).toEqual(targetCenter);
          });
        });

        describe('is moving backward (is always not beyond start position)', () => {
          // moving inHome3 back past inHome1
          it('should move before the closest impacted draggable', () => {
            const targetCenter: Position = moveToEdge({
              source: inHome3.client.marginBox,
              sourceEdge: 'start',
              destination: inHome1.client.marginBox,
              destinationEdge: 'start',
              destinationAxis: axis,
            });
            // the movement from the last drag
            const movement: DragMovement = {
              // ordered by closest to impacted
              displaced: [
                {
                  draggableId: inHome1.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                },
                {
                  draggableId: inHome2.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                },
              ],
              amount: inHome1Size,
              // is not beyond start position - going backwards
              isBeyondStartPosition: false,
            };

            const newCenter = getNewHomeClientCenter({
              movement,
              draggables,
              draggable: inHome3,
              destination: home,
            });

            expect(newCenter).toEqual(targetCenter);
          });
        });
      });

      describe('dropping in foreign list', () => {
        describe('is moving into a populated list', () => {
          it('should move above the target', () => {
            const targetCenter: Position = moveToEdge({
              source: inHome1.client.marginBox,
              sourceEdge: 'start',
              destination: inForeign1.client.marginBox,
              destinationEdge: 'start',
              destinationAxis: axis,
            });
            // the movement from the last drag
            const movement: DragMovement = {
              // ordered by closest to impacted
              displaced: [
                {
                  draggableId: inForeign1.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                },
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
              amount: inHome1Size,
              // not relevant when moving into new list
              isBeyondStartPosition: false,
            };

            const newCenter = getNewHomeClientCenter({
              movement,
              draggables,
              draggable: inHome1,
              destination: foreign,
            });

            expect(newCenter).toEqual(targetCenter);
          });
        });

        describe('is moving to end of a list', () => {
          it('should draggable below the last item in the list', () => {
            const targetCenter: Position = moveToEdge({
              source: inHome1.client.marginBox,
              sourceEdge: 'start',
              // will target the last in the foreign droppable
              destination: inForeign4.client.marginBox,
              destinationEdge: 'end',
              destinationAxis: axis,
            });
            // the movement from the last drag
            const movement: DragMovement = {
              // nothing has moved (going to end of list)
              displaced: [],
              amount: inHome1Size,
              // not relevant when moving into new list
              isBeyondStartPosition: false,
            };

            const newCenter = getNewHomeClientCenter({
              movement,
              draggables,
              draggable: inHome1,
              destination: foreign,
            });

            expect(newCenter).toEqual(targetCenter);
          });
        });

        describe('is moving to empty list', () => {
          it('should move to the start of the list', () => {
            const targetCenter: Position = moveToEdge({
              source: inHome1.client.marginBox,
              sourceEdge: 'start',
              destination: emptyForeign.client.contentBox,
              destinationEdge: 'start',
              destinationAxis: axis,
            });
            // the movement from the last drag
            const movement: DragMovement = {
              displaced: [],
              amount: inHome1Size,
              // not relevant when moving into new list
              isBeyondStartPosition: false,
            };

            const newCenter = getNewHomeClientCenter({
              movement,
              draggables,
              draggable: inHome1,
              destination: emptyForeign,
            });

            expect(newCenter).toEqual(targetCenter);
          });
        });
      });
    });
  });
});
