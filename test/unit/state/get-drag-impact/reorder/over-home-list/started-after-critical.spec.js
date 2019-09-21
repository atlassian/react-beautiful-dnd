// @flow
import { type Position } from 'css-box-model';
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import { patch } from '../../../../../../src/state/position';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import { getPreset } from '../../../../../util/dimension';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import type {
  Axis,
  DragImpact,
  Viewport,
  DisplacedBy,
} from '../../../../../../src/types';
import {
  backward,
  forward,
} from '../../../../../../src/state/user-direction/user-direction-preset';
import getLiftEffect from '../../../../../../src/state/get-lift-effect';
import beforePoint from '../../../../../util/before-point';
import afterPoint from '../../../../../util/after-point';
import getHomeLocation from '../../../../../../src/state/get-home-location';
import { getForcedDisplacement } from '../../../../../util/impact';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

    const crossAxisCenter: number =
      preset.inHome2.page.borderBox.center[axis.crossAxisLine];

    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome2.displaceBy,
    );
    const { afterCritical, impact: homeImpact } = getLiftEffect({
      draggable: preset.inHome2,
      home: preset.home,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });

    const startOfInHome3: Position = patch(
      axis.line,
      preset.inHome3.page.borderBox[axis.start],
      crossAxisCenter,
    );

    const goingForwards: DragImpact = getDragImpact({
      pageBorderBoxCenter: startOfInHome3,
      draggable: preset.inHome2,
      draggables: preset.draggables,
      droppables: preset.droppables,
      previousImpact: homeImpact,
      viewport,
      userDirection: forward,
      afterCritical,
    });

    // Do not need to move forward to a displaced edge.
    // The original edge is the displaced edge
    it('should displace items when moving forwards onto their start edge', () => {
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: beforePoint(startOfInHome3, axis),
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: homeImpact,
          viewport,
          userDirection: forward,
          afterCritical,
        });

        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            // inHome4 would have been displaced on lift so it won't be animated
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
            type: 'REORDER',
            destination: getHomeLocation(preset.inHome2.descriptor),
          },
        };

        expect(impact).toEqual(expected);
      }

      const expected: DragImpact = {
        displaced: getForcedDisplacement({
          // inHome4 would have been displaced on lift so it won't be animated
          visible: [
            {
              dimension: preset.inHome4,
              shouldAnimate: false,
            },
          ],
        }),
        displacedBy,
        at: {
          type: 'REORDER',
          destination: {
            // is now in position of inHome3
            droppableId: preset.home.descriptor.id,
            index: preset.inHome3.descriptor.index,
          },
        },
      };

      expect(goingForwards).toEqual(expected);
    });

    // Even though inHome3 is not 'displaced'
    // it is visibly displaced from the start of the drag
    it('should end displacement if moving backwards over the visibly displaced bottom edge', () => {
      const bottomEdgeOfInHome3: number =
        preset.inHome3.page.borderBox[axis.end];

      const onDisplacedBottomOfInHome3: Position = patch(
        axis.line,
        bottomEdgeOfInHome3 - displacedBy.value,
        crossAxisCenter,
      );

      // still not far enough
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: afterPoint(onDisplacedBottomOfInHome3, axis),
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: goingForwards,
          viewport,
          userDirection: backward,
          afterCritical,
        });
        expect(impact).toEqual(goingForwards);
      }
      // no longer displace as we have moved onto the bottom edge
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: onDisplacedBottomOfInHome3,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: goingForwards,
          viewport,
          userDirection: backward,
          afterCritical,
        });

        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            // inHome4 would have been displaced on lift so it won't be animated
            visible: [
              // inHome3 is now animated
              {
                dimension: preset.inHome3,
                shouldAnimate: true,
              },
              // inHome4 displacement stays not displaced
              {
                dimension: preset.inHome4,
                shouldAnimate: false,
              },
            ],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              droppableId: preset.home.descriptor.id,
              index: preset.inHome2.descriptor.index,
            },
          },
        };

        expect(impact).toEqual(expected);
      }
    });
  });
});
