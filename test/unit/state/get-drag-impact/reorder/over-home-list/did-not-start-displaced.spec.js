// @flow
import { type Position } from 'css-box-model';
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import { patch } from '../../../../../../src/state/position';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import { getPreset } from '../../../../../utils/dimension';
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
import beforePoint from '../../../../../utils/before-point';
import afterPoint from '../../../../../utils/after-point';
import { getForcedDisplacement } from '../../../../../utils/impact';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

    const crossAxisCenter: number =
      preset.inHome3.page.borderBox.center[axis.crossAxisLine];

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

    const onEndOfInHome1: Position = patch(
      axis.line,
      preset.inHome1.page.borderBox[axis.end],
      crossAxisCenter,
    );

    const goingBackwards: DragImpact = getDragImpact({
      pageBorderBoxCenter: onEndOfInHome1,
      draggable: preset.inHome3,
      draggables: preset.draggables,
      droppables: preset.droppables,
      previousImpact: homeImpact,
      viewport,
      userDirection: backward,
      afterCritical,
    });

    it('should displace items when moving backwards onto their bottom edge', () => {
      // after end of inHome1
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: afterPoint(onEndOfInHome1, axis),
          draggable: preset.inHome3,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: homeImpact,
          viewport,
          userDirection: backward,
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
        expect(impact).toEqual(expected);
      }

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
      expect(goingBackwards).toEqual(expected);
    });

    it('should end displacement if moving forward over the displaced top edge', () => {
      const topEdgeOfInHome1: number =
        preset.inHome1.page.borderBox[axis.start];
      const displacedTopEdgeOfInHome1: number =
        topEdgeOfInHome1 + displacedBy.value;

      const displacedTopEdge: Position = patch(
        axis.line,
        // onto top edge with without displacement
        displacedTopEdgeOfInHome1,
        // no change
        crossAxisCenter,
      );

      // still not far enough
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: beforePoint(displacedTopEdge, axis),
          draggable: preset.inHome3,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: goingBackwards,
          viewport,
          userDirection: forward,
          afterCritical,
        });
        expect(impact).toEqual(goingBackwards);
      }
      // no longer displace as we have moved onto the displaced top edge
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: displacedTopEdge,
          draggable: preset.inHome3,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: goingBackwards,
          viewport,
          userDirection: forward,
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
