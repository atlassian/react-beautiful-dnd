// @flow
import { type Position } from 'css-box-model';
import whenReordering from '../../../../../src/state/get-new-home-client-border-box-center/when-reordering';
import noImpact from '../../../../../src/state/no-impact';
import { patch } from '../../../../../src/state/position';
import { vertical, horizontal } from '../../../../../src/state/axis';
import { getPreset } from '../../../../utils/dimension';
import type { Axis, DragMovement } from '../../../../../src/types';
import getHomeImpact from '../../../../../src/state/get-home-impact';

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

    const inHome1Size: Position = patch(
      axis.line,
      inHome1.page.borderBox[axis.size],
    );

    it('should return home position when not over anything', () => {
      const result: ?Position = whenReordering({
        impact: noImpact,
        draggable: inHome1,
        draggables,
        destination: null,
      });

      expect(result).toEqual(null);
    });

    it('should return home position over home location', () => {
      const newCenter: ?Position = whenReordering({
        impact: getHomeImpact(inHome1, home),
        draggables,
        draggable: inHome1,
        destination: home,
      });

      expect(newCenter).toEqual(null);
    });

    it('should drop in front of the closest backwards displaced item', () => {});

    it('should drop in behind of the closest forwards displaced item', () => {});

    it('should drop after the last item in a list if nothing is displaced', () => {});

    it('should drop into the center of an item that is being combined with', () => {});

    it('should drop into the center of a displaced combined item', () => {});

    describe('dropping in home list', () => {
      describe('is moving forward (is always beyond start position)', () => {
        // moving the first item forward past the third item
        it('should move after the closest impacted draggable', () => {
          const targetCenter: Position = moveToEdge({
            source: inHome1.client.borderBox,
            sourceEdge: 'end',
            destination: inHome3.client.borderBox,
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
            isInFrontOfStart: true,
          };

          const newCenter = whenReordering({
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
            source: inHome3.client.borderBox,
            sourceEdge: 'start',
            destination: inHome1.client.borderBox,
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
            isInFrontOfStart: false,
          };

          const newCenter = whenReordering({
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
            source: inHome1.client.borderBox,
            sourceEdge: 'start',
            destination: inForeign1.client.borderBox,
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
            isInFrontOfStart: false,
          };

          const newCenter = whenReordering({
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
            source: inHome1.client.borderBox,
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
            isInFrontOfStart: false,
          };

          const newCenter = whenReordering({
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
            source: inHome1.client.borderBox,
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
            isInFrontOfStart: false,
          };

          const newCenter = whenReordering({
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
