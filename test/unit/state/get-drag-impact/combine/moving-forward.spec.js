// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  DisplacedBy,
  DroppableDimensionMap,
  Displacement,
} from '../../../../../src/types';
import { vertical, horizontal } from '../../../../../src/state/axis';
import { getPreset, enableCombining } from '../../../../utils/dimension';
import {
  forward,
  backward,
} from '../../../../../src/state/user-direction/user-direction-preset';
import getHomeImpact from '../../../../../src/state/get-home-impact';
import getDragImpact from '../../../../../src/state/get-drag-impact';
import getDisplacedBy from '../../../../../src/state/get-displaced-by';
import { patch, add, subtract } from '../../../../../src/state/position';
import getDisplacementMap from '../../../../../src/state/get-displacement-map';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const homeImpact: DragImpact = getHomeImpact(preset.inHome1, preset.home);
    const withCombineEnabled: DroppableDimensionMap = enableCombining(
      preset.droppables,
    );

    describe('non-displaced item', () => {
      // moving inHome1 forward
      const willDisplaceForward: boolean = false;
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome1.displaceBy,
        willDisplaceForward,
      );
      const beforeStart: Position = patch(
        axis.line,
        preset.inHome2.page.borderBox[axis.start] - 1,
        preset.inHome2.page.borderBox.center[axis.crossAxisLine],
      );
      const onStart: Position = add(beforeStart, patch(axis.line, 1));
      const onTwoThirds: Position = add(
        onStart,
        patch(axis.line, preset.inHome2.page.borderBox[axis.size] * 0.666),
      );

      it('should start combining when moving forward onto the start of an item', () => {
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: beforeStart,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: homeImpact,
            viewport: preset.viewport,
            userDirection: forward,
          });

          const expected: DragImpact = {
            movement: {
              displacedBy,
              willDisplaceForward,
              displaced: [],
              map: {},
            },
            direction: axis.direction,
            // still in home position
            destination: {
              droppableId: preset.home.descriptor.id,
              index: 0,
            },
            merge: null,
          };
          expect(impact).toEqual(expected);
        }
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: onStart,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: homeImpact,
            viewport: preset.viewport,
            userDirection: forward,
          });

          const expected: DragImpact = {
            movement: homeImpact.movement,
            direction: axis.direction,
            destination: null,
            merge: {
              whenEntered: forward,
              combine: {
                draggableId: preset.inHome2.descriptor.id,
                droppableId: preset.home.descriptor.id,
              },
            },
          };
          expect(impact).toEqual(expected);
        }
      });

      it('should start combining if first entered within start 2/3 of the size', () => {
        // entered within first 2/3
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: onTwoThirds,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: homeImpact,
            viewport: preset.viewport,
            userDirection: forward,
          });

          const expected: DragImpact = {
            movement: homeImpact.movement,
            direction: axis.direction,
            destination: null,
            merge: {
              whenEntered: forward,
              combine: {
                draggableId: preset.inHome2.descriptor.id,
                droppableId: preset.home.descriptor.id,
              },
            },
          };
          expect(impact).toEqual(expected);
        }
        // not entered within first 2/3
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: add(onTwoThirds, patch(axis.line, 1)),
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: homeImpact,
            viewport: preset.viewport,
            userDirection: forward,
          });

          // has now moved into a reorder
          const displaced: Displacement[] = [
            {
              draggableId: preset.inHome2.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
          ];
          const expected: DragImpact = {
            movement: {
              displacedBy,
              willDisplaceForward,
              displaced,
              map: getDisplacementMap(displaced),
            },
            direction: axis.direction,
            destination: {
              index: 1,
              droppableId: preset.home.descriptor.id,
            },
            merge: null,
          };
          expect(impact).toEqual(expected);
        }
      });

      it('should continue to combine if not moving forward past 2/3 of the non-displaced item - even if moving backwards', () => {
        const onTwoThirdsImpact: DragImpact = getDragImpact({
          pageBorderBoxCenter: onTwoThirds,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: homeImpact,
          viewport: preset.viewport,
          userDirection: forward,
        });
        // moving backwards within the first 2/3!!
        const pastTwoThirdsImpact: DragImpact = getDragImpact({
          pageBorderBoxCenter: subtract(onTwoThirds, patch(axis.line, 1)),
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: onTwoThirdsImpact,
          viewport: preset.viewport,
          userDirection: backward,
        });

        const expected: DragImpact = {
          movement: homeImpact.movement,
          direction: axis.direction,
          destination: null,
          merge: {
            whenEntered: forward,
            combine: {
              draggableId: preset.inHome2.descriptor.id,
              droppableId: preset.home.descriptor.id,
            },
          },
        };
        expect(onTwoThirdsImpact).toEqual(expected);
        expect(pastTwoThirdsImpact).toEqual(expected);
      });

      it('should not combine if entered after 2/3 size of the non-displaced item', () => {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: add(onTwoThirds, patch(axis.line, 1)),
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: homeImpact,
          viewport: preset.viewport,
          userDirection: forward,
        });

        // has skipped a combine and moved to a reorder
        const displaced: Displacement[] = [
          {
            draggableId: preset.inHome2.descriptor.id,
            isVisible: true,
            shouldAnimate: true,
          },
        ];
        const expected: DragImpact = {
          movement: {
            displacedBy,
            willDisplaceForward,
            displaced,
            map: getDisplacementMap(displaced),
          },
          direction: axis.direction,
          destination: {
            index: 1,
            droppableId: preset.home.descriptor.id,
          },
          merge: null,
        };
        expect(impact).toEqual(expected);
      });
    });

    describe('target displaced', () => {
      // inHome2 previously moved backwards in front of inHome1
      const willDisplaceForward: boolean = true;
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome2.displaceBy,
        willDisplaceForward,
      );
      // previously moved backwards and now moving forwards
      const displaced: Displacement[] = [
        {
          draggableId: preset.inHome1.descriptor.id,
          isVisible: true,
          shouldAnimate: true,
        },
      ];
      const withDisplacement: DragImpact = {
        movement: {
          displacedBy,
          willDisplaceForward,
          displaced,
          map: getDisplacementMap(displaced),
        },
        direction: axis.direction,
        destination: {
          index: 0,
          droppableId: preset.home.descriptor.id,
        },
        merge: null,
      };

      const onInHome1Start: Position = patch(
        axis.line,
        preset.inHome1.page.borderBox[axis.start],
        preset.inHome1.page.borderBox.center[axis.crossAxisLine],
      );
      const sizeOfDisplacement: number = preset.inHome2.displaceBy[axis.line];
      const onInHome1DisplacedStart: Position = add(
        onInHome1Start,
        patch(axis.line, sizeOfDisplacement),
      );
      const onInHome1DisplacedTwoThirds: Position = add(
        onInHome1DisplacedStart,
        patch(axis.line, preset.inHome1.page.borderBox[axis.size] * 0.666),
      );

      it('should not combine if only moving to the non-displaced start', () => {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: onInHome1Start,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: withDisplacement,
          viewport: preset.viewport,
          userDirection: forward,
        });
        expect(impact).toEqual(withDisplacement);
      });

      it('should combine when moving forward onto the start of a displaced item', () => {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: onInHome1DisplacedStart,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: withDisplacement,
          viewport: preset.viewport,
          userDirection: forward,
        });

        const expected: DragImpact = {
          movement: withDisplacement.movement,
          direction: axis.direction,
          destination: null,
          merge: {
            whenEntered: forward,
            combine: {
              draggableId: preset.inHome1.descriptor.id,
              droppableId: preset.home.descriptor.id,
            },
          },
        };
        expect(impact).toEqual(expected);
      });

      it('should not combine when moving forward past 2/3 of the size of the displaced item', () => {
        // on 2/3 line
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: onInHome1DisplacedTwoThirds,
            draggable: preset.inHome2,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: withDisplacement,
            viewport: preset.viewport,
            userDirection: forward,
          });

          const expected: DragImpact = {
            movement: withDisplacement.movement,
            direction: axis.direction,
            destination: null,
            merge: {
              whenEntered: forward,
              combine: {
                draggableId: preset.inHome1.descriptor.id,
                droppableId: preset.home.descriptor.id,
              },
            },
          };
          expect(impact).toEqual(expected);
        }
        // past 2/3 line
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: add(
              onInHome1DisplacedTwoThirds,
              patch(axis.line, 1),
            ),
            draggable: preset.inHome2,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: withDisplacement,
            viewport: preset.viewport,
            userDirection: forward,
          });

          expect(impact.merge).toEqual(null);
        }
      });
    });
  });
});
