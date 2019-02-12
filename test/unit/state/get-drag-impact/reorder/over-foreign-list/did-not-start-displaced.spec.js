// @flow
import { type Position } from 'css-box-model';
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import { add, patch, subtract } from '../../../../../../src/state/position';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import { getPreset } from '../../../../../utils/dimension';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import type {
  Axis,
  DragImpact,
  Viewport,
  Displacement,
  DisplacedBy,
} from '../../../../../../src/types';
import {
  backward,
  forward,
} from '../../../../../../src/state/user-direction/user-direction-preset';
import getHomeOnLift from '../../../../../../src/state/get-home-on-lift';
import getVisibleDisplacement from '../../../../../utils/get-displacement/get-visible-displacement';

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
    const { onLift, impact: homeImpact } = getHomeOnLift({
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
      onLift,
    });

    it('should displace items when moving backwards onto their bottom edge', () => {
      // after end of inHome1
      {
        const afterEndOfInForeign2: Position = add(
          onEndOfInForeign2,
          patch(axis.line, 1),
        );

        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: afterEndOfInForeign2,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: homeImpact,
          viewport,
          userDirection: backward,
          onLift,
        });

        // ordered by closest to current location
        // animated and visible as it is a foreign list
        const displaced: Displacement[] = [
          getVisibleDisplacement(preset.inForeign3),
          getVisibleDisplacement(preset.inForeign4),
        ];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          direction: axis.direction,
          destination: {
            // is now in position of inForeign3
            droppableId: preset.foreign.descriptor.id,
            index: preset.inForeign3.descriptor.index,
          },
          merge: null,
        };

        expect(impact).toEqual(expected);
      }
      // ordered by closest to current location
      const displaced: Displacement[] = [
        getVisibleDisplacement(preset.inForeign2),
        getVisibleDisplacement(preset.inForeign3),
        getVisibleDisplacement(preset.inForeign4),
      ];
      const expected: DragImpact = {
        movement: {
          displaced,
          map: getDisplacementMap(displaced),
          displacedBy,
        },
        direction: axis.direction,
        destination: {
          // is now in position of inForeign2
          droppableId: preset.inForeign2.descriptor.droppableId,
          index: preset.inForeign2.descriptor.index,
        },
        merge: null,
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
      const beforeDisplacedTopEdge: Position = subtract(
        displacedTopEdge,
        patch(axis.line, 1),
      );

      // still not far enough
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: beforeDisplacedTopEdge,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: goingBackwards,
          viewport,
          userDirection: forward,
          onLift,
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
          onLift,
        });
        // ordered by closest impacted
        const displaced: Displacement[] = [
          getVisibleDisplacement(preset.inForeign3),
          getVisibleDisplacement(preset.inForeign4),
        ];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          direction: axis.direction,
          destination: {
            // is now in position of inForeign3
            droppableId: preset.inForeign3.descriptor.droppableId,
            index: preset.inForeign3.descriptor.index,
          },
          merge: null,
        };
        expect(impact).toEqual(expected);
      }
    });
  });
});
