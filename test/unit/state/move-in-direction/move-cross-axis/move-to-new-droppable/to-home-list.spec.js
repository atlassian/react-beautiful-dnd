// @flow
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import type {
  Viewport,
  Axis,
  DragImpact,
  DisplacedBy,
  Displacement,
} from '../../../../../../src/types';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';
import getLiftEffect from '../../../../../../src/state/get-lift-effect';
import moveToNewDroppable from '../../../../../../src/state/move-in-direction/move-cross-axis/move-to-new-droppable';
import noImpact from '../../../../../../src/state/no-impact';
import { getPreset } from '../../../../../utils/dimension';
import getVisibleDisplacement from '../../../../../utils/get-displacement/get-visible-displacement';

const dontCare: Position = { x: 0, y: 0 };

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

    it('should not to anything if there is not target (can happen if invisible)', () => {
      const { onLift } = getHomeOnLift({
        draggable: preset.inHome2,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });

      expect(
        moveToNewDroppable({
          previousPageBorderBoxCenter: dontCare,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          moveRelativeTo: null,
          previousImpact: noImpact,
          viewport,
          onLift,
        }),
      ).toBe(null);
    });

    describe('moving back into original index', () => {
      it('should return a home impact with the original location', () => {
        // the second draggable is moving back into its preset.home
        const { onLift } = getHomeOnLift({
          draggable: preset.inHome2,
          home: preset.home,
          draggables: preset.draggables,
          viewport: preset.viewport,
        });
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome2.displaceBy,
        );

        const result: ?DragImpact = moveToNewDroppable({
          previousPageBorderBoxCenter: dontCare,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          moveRelativeTo: preset.inHome2,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: noImpact,
          viewport,
          onLift,
        });
        invariant(result);

        const displaced: Displacement[] = [
          // unlike the original displacement, this will be animated
          getVisibleDisplacement(preset.inHome3),
          getVisibleDisplacement(preset.inHome4),
        ];
        const expected: DragImpact = {
          movement: {
            displacedBy,
            displaced,
            map: getDisplacementMap(displaced),
          },
          destination: {
            droppableId: preset.home.descriptor.id,
            index: preset.inHome2.descriptor.index,
          },
          merge: null,
        };
        expect(result).toEqual(expected);
      });
    });

    describe('moving before the original index', () => {
      it('should move the everything after the target index forward', () => {
        // moving preset.inHome4 into the preset.inHome2 position
        const { onLift } = getHomeOnLift({
          draggable: preset.inHome4,
          home: preset.home,
          draggables: preset.draggables,
          viewport: preset.viewport,
        });
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome4.displaceBy,
        );

        const result: ?DragImpact = moveToNewDroppable({
          previousPageBorderBoxCenter: dontCare,
          draggable: preset.inHome4,
          draggables: preset.draggables,
          moveRelativeTo: preset.inHome2,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: noImpact,
          viewport,
          onLift,
        });
        invariant(result);

        const displaced: Displacement[] = [
          getVisibleDisplacement(preset.inHome2),
          getVisibleDisplacement(preset.inHome3),
          // inHome4 not displaced!
        ];
        const expected: DragImpact = {
          movement: {
            // ordered by closest impacted
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          destination: {
            droppableId: preset.home.descriptor.id,
            index: preset.inHome2.descriptor.index,
          },
          merge: null,
        };
        expect(result).toEqual(expected);
      });
    });

    describe('moving after the original index', () => {
      it('should move the everything from the target index to the original index forward', () => {
        // moving inHome1 after inHome4
        const { onLift } = getHomeOnLift({
          draggable: preset.inHome1,
          home: preset.home,
          draggables: preset.draggables,
          viewport: preset.viewport,
        });
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome1.displaceBy,
        );
        const result: ?DragImpact = moveToNewDroppable({
          previousPageBorderBoxCenter: dontCare,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          moveRelativeTo: preset.inHome4,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: noImpact,
          viewport,
          onLift,
        });
        invariant(result);

        const displaced: Displacement[] = [];
        const expected: DragImpact = {
          movement: {
            // ordered by closest impacted
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          destination: {
            droppableId: preset.home.descriptor.id,
            index: preset.inHome4.descriptor.index,
          },
          merge: null,
        };
        expect(result).toEqual(expected);
      });
    });
  });
});
