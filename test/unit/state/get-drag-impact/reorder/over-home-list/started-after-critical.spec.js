// @flow
import { type Position } from 'css-box-model';
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import { subtract } from '../../../../../../src/state/position';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import { getPreset } from '../../../../../util/dimension';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import type {
  Axis,
  DragImpact,
  Viewport,
  DisplacedBy,
} from '../../../../../../src/types';
import getLiftEffect from '../../../../../../src/state/get-lift-effect';
import beforePoint from '../../../../../util/before-point';
import afterPoint from '../../../../../util/after-point';
import getHomeLocation from '../../../../../../src/state/get-home-location';
import { getForcedDisplacement } from '../../../../../util/impact';
import {
  getCenterForEndEdge,
  getCenterForStartEdge,
} from '../../util/get-edge-from-center';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

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

    const centerForEndOnInHome3Center: Position = getCenterForEndEdge({
      endEdgeOn: preset.inHome3.page.borderBox.center,
      dragging: preset.inHome2.page.borderBox,
      axis,
    });

    const endOnInHome3Center: DragImpact = getDragImpact({
      pageBorderBoxCenter: centerForEndOnInHome3Center,
      draggable: preset.inHome2,
      draggables: preset.draggables,
      droppables: preset.droppables,
      previousImpact: homeImpact,
      viewport,
      afterCritical,
    });

    // Do not need to move forward to a displaced edge.
    // The original edge is the displaced edge
    it('should displace items backwards when end of dragging item hits the target center', () => {
      {
        const endBeforeInHome3Center: DragImpact = getDragImpact({
          // not currently on
          pageBorderBoxCenter: beforePoint(centerForEndOnInHome3Center, axis),
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: homeImpact,
          viewport,
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

        expect(endBeforeInHome3Center).toEqual(expected);
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

      expect(endOnInHome3Center).toEqual(expected);
    });

    // Even though inHome3 is not 'displaced'
    // it is visibly displaced from the start of the drag
    it('should end displacement if the start of the dragging item is less than the displaced target center', () => {
      const displacedInHome3Center: Position = subtract(
        preset.inHome3.page.borderBox.center,
        displacedBy.point,
      );

      const centerForStartOnDisplacedInHome2Center: Position = getCenterForStartEdge(
        {
          startEdgeOn: displacedInHome3Center,
          dragging: preset.inHome2.page.borderBox,
          axis,
        },
      );

      // still not far enough
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: afterPoint(
            centerForStartOnDisplacedInHome2Center,
            axis,
          ),
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: endOnInHome3Center,
          viewport,
          afterCritical,
        });
        expect(impact).toEqual(endOnInHome3Center);
      }
      // no longer displace as we move backwards past the displaced center
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: centerForStartOnDisplacedInHome2Center,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: endOnInHome3Center,
          viewport,
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
