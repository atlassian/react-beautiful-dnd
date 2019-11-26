// @flow
import { type Position } from 'css-box-model';
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import { add } from '../../../../../../src/state/position';
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
import { getForcedDisplacement } from '../../../../../util/impact';
import {
  getCenterForStartEdge,
  getCenterForEndEdge,
} from '../../util/get-edge-from-center';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome3.displaceBy,
    );
    const { afterCritical, impact: homeImpact } = getLiftEffect({
      draggable: preset.inHome3,
      home: preset.home,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });

    const centerForStartOnInHome1Center: Position = getCenterForStartEdge({
      startEdgeOn: preset.inHome1.page.borderBox.center,
      dragging: preset.inHome3.page.borderBox,
      axis,
    });

    const startBeforeInHome1Center: DragImpact = getDragImpact({
      pageBorderBoxCenter: beforePoint(centerForStartOnInHome1Center, axis),
      draggable: preset.inHome3,
      draggables: preset.draggables,
      droppables: preset.droppables,
      previousImpact: homeImpact,
      viewport,
      afterCritical,
    });

    it('should displace items forward when the start edge of the dragging item goes backwards past the items center', () => {
      // after center of inHome1
      {
        const startOnInHome1Center: DragImpact = getDragImpact({
          pageBorderBoxCenter: centerForStartOnInHome1Center,
          draggable: preset.inHome3,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: homeImpact,
          viewport,
          afterCritical,
        });

        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            // ordered by closest to current location
            visible: [
              { dimension: preset.inHome2, shouldAnimate: true },
              // inHome3 is not displaced as it is the dragging item
              // inHome4 would have been displaced on lift so it won't be animated
              { dimension: preset.inHome4, shouldAnimate: false },
            ],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              // is now in position of inHome2
              droppableId: preset.home.descriptor.id,
              index: preset.inHome2.descriptor.index,
            },
          },
        };
        expect(startOnInHome1Center).toEqual(expected);
      }
      // on center of inHome1
      {
        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            // ordered by closest to current location
            visible: [
              { dimension: preset.inHome1 },
              { dimension: preset.inHome2 },
              // inHome3 is not displaced as it is the dragging item
              // inHome4 would have been displaced on lift so it won't be animated
              { dimension: preset.inHome4, shouldAnimate: false },
            ],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              // is now in position of inHome1
              droppableId: preset.home.descriptor.id,
              index: preset.inHome1.descriptor.index,
            },
          },
        };
        expect(startBeforeInHome1Center).toEqual(expected);
      }
    });

    it('should end displacement if the dragging item bottom edge goes forward past the displaced center', () => {
      const displacedInHome1Center: Position = add(
        preset.inHome1.page.borderBox.center,
        displacedBy.point,
      );

      const centerForEndOnDisplacedInHome1Center: Position = getCenterForEndEdge(
        {
          endEdgeOn: displacedInHome1Center,
          dragging: preset.inHome3.page.borderBox,
          axis,
        },
      );

      // still not far enough
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: centerForEndOnDisplacedInHome1Center,
          draggable: preset.inHome3,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: startBeforeInHome1Center,
          viewport,
          afterCritical,
        });
        expect(impact).toEqual(startBeforeInHome1Center);
      }
      // no longer displace as we have moved onto the displaced top edge
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: afterPoint(
            centerForEndOnDisplacedInHome1Center,
            axis,
          ),
          draggable: preset.inHome3,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: startBeforeInHome1Center,
          viewport,
          afterCritical,
        });

        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            visible: [
              { dimension: preset.inHome2 },
              // not displacing inHome3 as it is the dragging item
              { dimension: preset.inHome4, shouldAnimate: false },
            ],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              droppableId: preset.home.descriptor.id,
              // is now in position of inHome2
              index: preset.inHome2.descriptor.index,
            },
          },
        };
        expect(impact).toEqual(expected);
      }
    });
  });
});
