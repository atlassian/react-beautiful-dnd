// @flow
import type { Position } from 'css-box-model';
import type {
  DisplacedBy,
  Axis,
  DimensionMap,
  Displacement,
  DragImpact,
  DroppableDimension,
} from '../../../src/types';
import { getPreset } from '../../utils/dimension';
import getDisplacedBy from '../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../src/state/get-displacement-map';
import { horizontal, vertical } from '../../../src/state/axis';
import getHomeImpact from '../../../src/state/get-home-impact';
import getDimensionMapWithPlaceholder from '../../../src/state/get-dimension-map-with-placeholder';
import noImpact from '../../../src/state/no-impact';
import getVisibleDisplacement from '../../utils/get-visible-displacement';
import { addPlaceholder } from '../../../src/state/droppable/with-placeholder';
import { patch } from '../../../src/state/position';
import patchDroppableMap from '../../../src/state/patch-droppable-map';

[horizontal, vertical].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    const homeImpact: DragImpact = getHomeImpact(preset.inHome1, preset.home);

    it('should not do anything if there is no destination change', () => {
      const result: DimensionMap = getDimensionMapWithPlaceholder({
        dimensions: preset.dimensions,
        previousImpact: homeImpact,
        impact: homeImpact,
        draggable: preset.inHome1,
      });

      expect(result).toEqual(preset.dimensions);
    });

    it('should not do anything if there is no destination', () => {
      const result1: DimensionMap = getDimensionMapWithPlaceholder({
        dimensions: preset.dimensions,
        previousImpact: homeImpact,
        impact: noImpact,
        draggable: preset.inHome1,
      });
      const result2: DimensionMap = getDimensionMapWithPlaceholder({
        dimensions: preset.dimensions,
        previousImpact: noImpact,
        impact: noImpact,
        draggable: preset.inHome1,
      });

      expect(result1).toEqual(preset.dimensions);
      expect(result2).toEqual(preset.dimensions);
    });

    it('should add a placeholder if moving to a foreign list', () => {
      const willDisplaceForward: boolean = true;
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome1.displaceBy,
        willDisplaceForward,
      );
      const displaced: Displacement[] = [
        getVisibleDisplacement(preset.inForeign1),
        getVisibleDisplacement(preset.inForeign2),
        getVisibleDisplacement(preset.inForeign3),
        getVisibleDisplacement(preset.inForeign4),
      ];
      const overForeign: DragImpact = {
        movement: {
          willDisplaceForward,
          displacedBy,
          displaced,
          map: getDisplacementMap(displaced),
        },
        direction: preset.foreign.axis.direction,
        merge: null,
        destination: {
          index: preset.inForeign1.descriptor.index,
          droppableId: preset.foreign.descriptor.id,
        },
      };

      const first: DimensionMap = getDimensionMapWithPlaceholder({
        dimensions: preset.dimensions,
        previousImpact: homeImpact,
        impact: overForeign,
        draggable: preset.inHome1,
      });

      expect(first).not.toEqual(preset.dimensions);
      const placeholderSize: Position = patch(
        axis.line,
        preset.inHome1.displaceBy[axis.line],
      );
      const withPlaceholder: DroppableDimension = addPlaceholder(
        preset.foreign,
        placeholderSize,
        preset.draggables,
      );
      expect(first).toEqual(
        patchDroppableMap(preset.dimensions, withPlaceholder),
      );

      // now moving forward (should not add another placeholder)
      const displaced2: Displacement[] = [
        getVisibleDisplacement(preset.inForeign2),
        getVisibleDisplacement(preset.inForeign3),
        getVisibleDisplacement(preset.inForeign4),
      ];
      const overForeign2: DragImpact = {
        movement: {
          willDisplaceForward,
          displacedBy,
          displaced: displaced2,
          map: getDisplacementMap(displaced2),
        },
        direction: preset.foreign.axis.direction,
        merge: null,
        destination: {
          index: preset.inForeign2.descriptor.index,
          droppableId: preset.foreign.descriptor.id,
        },
      };
      const second: DimensionMap = getDimensionMapWithPlaceholder({
        dimensions: preset.dimensions,
        previousImpact: overForeign,
        impact: overForeign2,
        draggable: preset.inHome1,
      });

      expect(second).toEqual(first);
    });

    it('should remove a placeholder if moving from a foreign list', () => {
      const willDisplaceForward: boolean = true;
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome1.displaceBy,
        willDisplaceForward,
      );
      const displaced: Displacement[] = [
        getVisibleDisplacement(preset.inForeign1),
        getVisibleDisplacement(preset.inForeign2),
        getVisibleDisplacement(preset.inForeign3),
        getVisibleDisplacement(preset.inForeign4),
      ];
      const overForeign: DragImpact = {
        movement: {
          willDisplaceForward,
          displacedBy,
          displaced,
          map: getDisplacementMap(displaced),
        },
        direction: preset.foreign.axis.direction,
        merge: null,
        destination: {
          index: preset.inForeign1.descriptor.index,
          droppableId: preset.foreign.descriptor.id,
        },
      };

      // has a placeholder when moving over foreign
      {
        const toForeign: DimensionMap = getDimensionMapWithPlaceholder({
          dimensions: preset.dimensions,
          previousImpact: homeImpact,
          impact: overForeign,
          draggable: preset.inHome1,
        });

        expect(toForeign).not.toEqual(preset.dimensions);
        expect(
          toForeign.droppables[preset.foreign.descriptor.id].subject
            .withPlaceholder,
        ).toBeTruthy();
      }
      // no placeholder when moving back over home
      {
        const toHome: DimensionMap = getDimensionMapWithPlaceholder({
          dimensions: preset.dimensions,
          previousImpact: overForeign,
          impact: homeImpact,
          draggable: preset.inHome1,
        });

        expect(toHome).toEqual(preset.dimensions);
      }

      // no placeholder when moving over nothing
      {
        const toNoWhere: DimensionMap = getDimensionMapWithPlaceholder({
          dimensions: preset.dimensions,
          previousImpact: overForeign,
          impact: noImpact,
          draggable: preset.inHome1,
        });

        expect(toNoWhere).toEqual(preset.dimensions);
      }
    });
  });
});
