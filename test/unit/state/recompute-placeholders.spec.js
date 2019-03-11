// @flow
import type {
  DisplacedBy,
  Axis,
  Displacement,
  DragImpact,
  DroppableDimension,
  DroppableDimensionMap,
} from '../../../src/types';
import { getPreset } from '../../utils/dimension';
import getDisplacedBy from '../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../src/state/get-displacement-map';
import { horizontal, vertical } from '../../../src/state/axis';
import recomputePlaceholders from '../../../src/state/recompute-placeholders';
import noImpact from '../../../src/state/no-impact';
import getVisibleDisplacement from '../../utils/get-displacement/get-visible-displacement';
import { addPlaceholder } from '../../../src/state/droppable/with-placeholder';
import patchDroppableMap from '../../../src/state/patch-droppable-map';
import getHomeOnLift from '../../../src/state/get-home-on-lift';

[horizontal, vertical].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const { impact: homeImpact } = getHomeOnLift({
      draggable: preset.inHome1,
      draggables: preset.draggables,
      home: preset.home,
      viewport: preset.viewport,
    });

    it('should not do anything if there is no destination change', () => {
      const result: DroppableDimensionMap = recomputePlaceholders({
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: preset.droppables,
        impact: homeImpact,
        previousImpact: homeImpact,
      });

      expect(result).toEqual(preset.droppables);
    });

    it('should not do anything if there is no destination', () => {
      const result1: DroppableDimensionMap = recomputePlaceholders({
        previousImpact: homeImpact,
        impact: noImpact,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: preset.droppables,
      });
      const result2: DroppableDimensionMap = recomputePlaceholders({
        previousImpact: noImpact,
        impact: noImpact,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: preset.droppables,
      });

      expect(result1).toEqual(preset.droppables);
      expect(result2).toEqual(preset.droppables);
    });

    it('should add a placeholder if moving to a foreign list', () => {
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome1.displaceBy,
      );
      const displaced: Displacement[] = [
        getVisibleDisplacement(preset.inForeign1),
        getVisibleDisplacement(preset.inForeign2),
        getVisibleDisplacement(preset.inForeign3),
        getVisibleDisplacement(preset.inForeign4),
      ];
      const overForeign: DragImpact = {
        movement: {
          displacedBy,
          displaced,
          map: getDisplacementMap(displaced),
        },
        merge: null,
        destination: {
          index: preset.inForeign1.descriptor.index,
          droppableId: preset.foreign.descriptor.id,
        },
      };

      const first: DroppableDimensionMap = recomputePlaceholders({
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: homeImpact,
        impact: overForeign,
        draggable: preset.inHome1,
      });

      expect(first).not.toEqual(preset.droppables);
      const withPlaceholder: DroppableDimension = addPlaceholder(
        preset.foreign,
        preset.inHome1,
        preset.draggables,
      );
      expect(first).toEqual(
        patchDroppableMap(preset.droppables, withPlaceholder),
      );

      // now moving forward (should not add another placeholder)
      const displaced2: Displacement[] = [
        getVisibleDisplacement(preset.inForeign2),
        getVisibleDisplacement(preset.inForeign3),
        getVisibleDisplacement(preset.inForeign4),
      ];
      const overForeign2: DragImpact = {
        movement: {
          displacedBy,
          displaced: displaced2,
          map: getDisplacementMap(displaced2),
        },
        merge: null,
        destination: {
          index: preset.inForeign2.descriptor.index,
          droppableId: preset.foreign.descriptor.id,
        },
      };
      const second: DroppableDimensionMap = recomputePlaceholders({
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: overForeign,
        impact: overForeign2,
      });

      expect(second).toEqual(first);
    });

    it('should remove a placeholder if moving from a foreign list', () => {
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome1.displaceBy,
      );
      const displaced: Displacement[] = [
        getVisibleDisplacement(preset.inForeign1),
        getVisibleDisplacement(preset.inForeign2),
        getVisibleDisplacement(preset.inForeign3),
        getVisibleDisplacement(preset.inForeign4),
      ];
      const overForeign: DragImpact = {
        movement: {
          displacedBy,
          displaced,
          map: getDisplacementMap(displaced),
        },
        merge: null,
        destination: {
          index: preset.inForeign1.descriptor.index,
          droppableId: preset.foreign.descriptor.id,
        },
      };

      // has a placeholder when moving over foreign
      {
        const toForeign: DroppableDimensionMap = recomputePlaceholders({
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: homeImpact,
          impact: overForeign,
          draggable: preset.inHome1,
        });

        expect(toForeign).not.toEqual(preset.droppables);
        expect(
          toForeign[preset.foreign.descriptor.id].subject.withPlaceholder,
        ).toBeTruthy();
      }
      // no placeholder when moving back over home
      {
        const toHome: DroppableDimensionMap = recomputePlaceholders({
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: overForeign,
          impact: homeImpact,
          draggable: preset.inHome1,
        });

        expect(toHome).toEqual(preset.droppables);
      }

      // no placeholder when moving over nothing
      {
        const toNoWhere: DroppableDimensionMap = recomputePlaceholders({
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: overForeign,
          impact: noImpact,
          draggable: preset.inHome1,
        });

        expect(toNoWhere).toEqual(preset.droppables);
      }
    });
  });
});
