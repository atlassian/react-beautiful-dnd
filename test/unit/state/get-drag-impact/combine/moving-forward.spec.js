// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  DisplacedBy,
  DroppableDimensionMap,
} from '../../../../../src/types';
import { vertical, horizontal } from '../../../../../src/state/axis';
import { getPreset, enableCombining } from '../../../../utils/dimension';
import { forward } from '../../../../../src/state/user-direction/user-direction-preset';
import getHomeImpact from '../../../../../src/state/get-home-impact';
import getDragImpact from '../../../../../src/state/get-drag-impact';
import getDisplacedBy from '../../../../../src/state/get-displaced-by';
import { patch, add } from '../../../../../src/state/position';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const withCombineEnabled: DroppableDimensionMap = enableCombining(
      preset.droppables,
    );
    // moving inHome1 forward
    const willDisplaceForward: boolean = false;
    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome1.displaceBy,
      willDisplaceForward,
    );

    describe('non-displaced item', () => {
      const onStart: Position = patch(
        axis.line,
        preset.inHome2.page.borderBox[axis.start],
        preset.inHome2.page.borderBox.center[axis.crossAxisLine],
      );
      const overStart: Position = add(onStart, patch(axis.line, 1));
      const onTwoThirds: Position = add(
        onStart,
        patch(axis.line, preset.inHome2.page.borderBox[axis.size]),
      );
      const overTwoThirds: Position = add(onTwoThirds, patch(axis.line, 1));

      it('should start combining when moving forward over the start of item', () => {
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: onStart,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: getHomeImpact(preset.inHome1, preset.home),
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
            pageBorderBoxCenter: overStart,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: getHomeImpact(preset.inHome1, preset.home),
            viewport: preset.viewport,
            userDirection: forward,
          });

          const expected: DragImpact = {
            movement: getHomeImpact(preset.inHome1, preset.home).movement,
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

      it('should start combining if first hit up to 2/3 of the size', () => {
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: onTwoThirds,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: getHomeImpact(preset.inHome1, preset.home),
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

      it('should continue to combine if not moving forward past 2/3 of the non-displaced item - even if moving backwards', () => {});

      it('should stop combining when moving past 2/3 of the non-displaced item', () => {});
    });

    describe('displaced', () => {});
  });
});
