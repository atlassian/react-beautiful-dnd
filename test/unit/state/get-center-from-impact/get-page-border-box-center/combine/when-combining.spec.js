// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  DroppableDimension,
  DisplacedBy,
  DragImpact,
} from '../../../../../../src/types';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import getPageBorderBoxCenter from '../../../../../../src/state/get-center-from-impact/get-page-border-box-center';
import getLiftEffect from '../../../../../../src/state/get-lift-effect';
import { getPreset } from '../../../../../utils/dimension';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import {
  forward,
  backward,
} from '../../../../../../src/state/user-direction/user-direction-preset';
import { subtract, add } from '../../../../../../src/state/position';
import { getForcedDisplacement } from '../../../../../utils/impact';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const withCombineEnabled: DroppableDimension = {
      ...preset.home,
      isCombineEnabled: true,
    };
    const { afterCritical } = getLiftEffect({
      draggable: preset.inHome2,
      home: withCombineEnabled,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });
    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome2.displaceBy,
    );

    describe('item started displaced', () => {
      it('should move onto a displaced center - the initial visible center', () => {
        const impact: DragImpact = {
          displaced: getForcedDisplacement({
            visible: [
              {
                dimension: preset.inHome3,
                shouldAnimate: false,
              },
              {
                dimension: preset.inHome4,
                shouldAnimate: false,
              },
            ],
          }),
          displacedBy,
          at: {
            type: 'COMBINE',
            whenEntered: forward,
            // combining with inHome3
            combine: {
              draggableId: preset.inHome3.descriptor.id,
              droppableId: preset.inHome3.descriptor.droppableId,
            },
          },
        };

        const result: Position = getPageBorderBoxCenter({
          impact,
          afterCritical,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppable: withCombineEnabled,
        });

        expect(result).toEqual(preset.inHome3.page.borderBox.center);
      });

      it('should move onto a non-displaced center', () => {
        // combining with inHome3 which is no longer displaced
        // inHome2 would have moved forward and is now moving backwards
        const impact: DragImpact = {
          displaced: getForcedDisplacement({
            visible: [{ dimension: preset.inHome4, shouldAnimate: false }],
          }),
          displacedBy,
          at: {
            type: 'COMBINE',
            whenEntered: backward,
            // combining with not displaced inHome1
            combine: {
              draggableId: preset.inHome3.descriptor.id,
              droppableId: preset.inHome3.descriptor.droppableId,
            },
          },
        };

        const result: Position = getPageBorderBoxCenter({
          impact,
          afterCritical,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppable: withCombineEnabled,
        });

        const expected: Position = subtract(
          preset.inHome3.page.borderBox.center,
          displacedBy.point,
        );
        expect(result).toEqual(expected);
      });
    });

    describe('item did not start displaced', () => {
      it('should move onto a displaced center', () => {
        // moving inHome2 backwards past inHome1 (pushing it forward)
        // and then moving onto inHome1
        const impact: DragImpact = {
          displaced: getForcedDisplacement({
            // inHome2 not displaced as it is the dragging item
            visible: [
              {
                dimension: preset.inHome1,
                shouldAnimate: true,
              },
              {
                dimension: preset.inHome3,
                shouldAnimate: false,
              },
              {
                dimension: preset.inHome4,
                shouldAnimate: false,
              },
            ],
          }),
          displacedBy,
          at: {
            type: 'COMBINE',
            whenEntered: backward,
            // combining with not displaced inHome1
            combine: {
              draggableId: preset.inHome1.descriptor.id,
              droppableId: preset.inHome1.descriptor.droppableId,
            },
          },
        };

        const result: Position = getPageBorderBoxCenter({
          impact,
          afterCritical,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppable: withCombineEnabled,
        });

        const expected: Position = add(
          preset.inHome1.page.borderBox.center,
          displacedBy.point,
        );
        expect(result).toEqual(expected);
      });

      it('should move onto a non-displaced center', () => {
        // moving inHome2 backwards onto inHome1
        const impact: DragImpact = {
          displaced: getForcedDisplacement({
            // inHome2 not displaced as it is the dragging item
            visible: [
              {
                dimension: preset.inHome3,
                shouldAnimate: false,
              },
              {
                dimension: preset.inHome4,
                shouldAnimate: false,
              },
            ],
          }),
          displacedBy,
          at: {
            type: 'COMBINE',
            whenEntered: backward,
            // combining with not displaced inHome1
            combine: {
              draggableId: preset.inHome1.descriptor.id,
              droppableId: preset.inHome1.descriptor.droppableId,
            },
          },
        };

        const result: Position = getPageBorderBoxCenter({
          impact,
          afterCritical,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppable: withCombineEnabled,
        });

        expect(result).toEqual(preset.inHome1.page.borderBox.center);
      });
    });
  });
});
