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
import afterPoint from '../../../../../util/after-point';
import beforePoint from '../../../../../util/before-point';
import { getForcedDisplacement } from '../../../../../util/impact';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

    const crossAxisCenter: number =
      preset.foreign.page.borderBox.center[axis.crossAxisLine];

    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome1.displaceBy,
    );
    const { afterCritical, impact: homeImpact } = getLiftEffect({
      draggable: preset.inHome1,
      home: preset.home,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });

    const onEndOfInForeign2: Position = patch(
      axis.line,
      preset.inForeign2.page.borderBox[axis.end],
      crossAxisCenter,
    );

    const goingBackwards: DragImpact = getDragImpact({
      pageBorderBoxCenter: onEndOfInForeign2,
      draggable: preset.inHome1,
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
          pageBorderBoxCenter: afterPoint(onEndOfInForeign2, axis),
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: homeImpact,
          viewport,
          userDirection: backward,
          afterCritical,
        });

        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            visible: [
              // ordered by closest to current location
              // animated and visible as it is a foreign list
              { dimension: preset.inForeign3 },
              { dimension: preset.inForeign4 },
            ],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              // is now in position of inForeign3
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign3.descriptor.index,
            },
          },
        };

        expect(impact).toEqual(expected);
      }

      const expected: DragImpact = {
        displaced: getForcedDisplacement({
          // ordered by closest to current location
          visible: [
            { dimension: preset.inForeign2 },
            { dimension: preset.inForeign3 },
            { dimension: preset.inForeign4 },
          ],
        }),
        displacedBy,
        at: {
          type: 'REORDER',
          destination: {
            // is now in position of inForeign2
            droppableId: preset.inForeign2.descriptor.droppableId,
            index: preset.inForeign2.descriptor.index,
          },
        },
      };
      expect(goingBackwards).toEqual(expected);
    });

    it('should end displacement if moving forward over the displaced top edge', () => {
      const topEdgeOfInForeign2: number =
        preset.inForeign2.page.borderBox[axis.start];
      const displacedTopEdgeOfInForeign2: number =
        topEdgeOfInForeign2 + displacedBy.value;

      const displacedTopEdge: Position = patch(
        axis.line,
        // onto top edge with without displacement
        displacedTopEdgeOfInForeign2,
        // no change
        crossAxisCenter,
      );

      // still not far enough
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: beforePoint(displacedTopEdge, axis),
          draggable: preset.inHome1,
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
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: goingBackwards,
          viewport,
          userDirection: forward,
          afterCritical,
        });

        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            // ordered by closest impacted
            visible: [
              { dimension: preset.inForeign3 },
              { dimension: preset.inForeign4 },
            ],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              // is now in position of inForeign3
              droppableId: preset.inForeign3.descriptor.droppableId,
              index: preset.inForeign3.descriptor.index,
            },
          },
        };
        expect(impact).toEqual(expected);
      }
    });
  });
});
