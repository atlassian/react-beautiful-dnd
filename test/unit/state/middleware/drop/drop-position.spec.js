// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  Viewport,
  Axis,
  DragImpact,
  DisplacedBy,
  Displacement,
  DimensionMap,
} from '../../../../../src/types';
import { vertical, horizontal } from '../../../../../src/state/axis';
import {
  add,
  negate,
  subtract,
  origin,
} from '../../../../../src/state/position';
import scrollDroppable from '../../../../../src/state/droppable/scroll-droppable';
import { getPreset, makeScrollable } from '../../../../utils/dimension';
import getNotAnimatedDisplacement from '../../../../utils/get-displacement/get-not-animated-displacement';
import getClientBorderBoxCenter from '../../../../../src/state/get-center-from-impact/get-client-border-box-center';
import getDisplacedBy from '../../../../../src/state/get-displaced-by';
import { forward } from '../../../../../src/state/user-direction/user-direction-preset';
import noImpact from '../../../../../src/state/no-impact';
import getHomeOnLift from '../../../../../src/state/get-home-on-lift';
import getDisplacementMap from '../../../../../src/state/get-displacement-map';
import getNewHomeClientOffset from '../../../../../src/state/middleware/drop/get-new-home-client-offset';
import patchDroppableMap from '../../../../../src/state/patch-droppable-map';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const { onLift, impact: homeImpact } = getHomeOnLift({
      draggable: preset.inHome1,
      draggables: preset.draggables,
      home: preset.home,
      viewport: preset.viewport,
    });
    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome1.displaceBy,
    );

    it('should return nothing if already over the home', () => {
      const offset: Position = getNewHomeClientOffset({
        impact: homeImpact,
        draggable: preset.inHome1,
        dimensions: preset.dimensions,
        viewport: preset.viewport,
        onLift,
      });

      expect(offset).toEqual(origin);
    });

    it('should return the difference between the current client position and where it needs to be', () => {
      // inHome1 in inHome2 position
      const displaced: Displacement[] = [
        getNotAnimatedDisplacement(preset.inHome3),
        getNotAnimatedDisplacement(preset.inHome4),
      ];
      const pastInHome2: DragImpact = {
        movement: {
          displaced,
          map: getDisplacementMap(displaced),
          displacedBy,
        },
        direction: axis.direction,
        merge: null,
        destination: {
          index: preset.inHome2.descriptor.index,
          droppableId: preset.home.descriptor.id,
        },
      };

      const currentClientCenter: Position = getClientBorderBoxCenter({
        impact: pastInHome2,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        onLift,
        droppable: preset.home,
        viewport: preset.viewport,
      });
      const offsetFromHome: Position = getNewHomeClientOffset({
        impact: pastInHome2,
        draggable: preset.inHome1,
        dimensions: preset.dimensions,
        viewport: preset.viewport,
        onLift,
      });

      const diff: Position = subtract(
        currentClientCenter,
        preset.inHome1.client.borderBox.center,
      );
      expect(offsetFromHome).toEqual(diff);
    });

    it('should account for a collapsing home draggable when merging', () => {
      // inHome1 merging with inHome3
      // inHome1 will collapse on drop and this needs to be accounted for
      const displaced: Displacement[] = [
        // inHome2 is no longer displaced
        getNotAnimatedDisplacement(preset.inHome3),
        getNotAnimatedDisplacement(preset.inHome4),
      ];
      const mergingWithInHome3: DragImpact = {
        movement: {
          displaced,
          map: getDisplacementMap(displaced),
          displacedBy,
        },
        direction: axis.direction,
        destination: null,
        merge: {
          whenEntered: forward,
          combine: {
            draggableId: preset.inHome3.descriptor.id,
            droppableId: preset.home.descriptor.id,
          },
        },
      };

      const currentClientCenter: Position = getClientBorderBoxCenter({
        impact: mergingWithInHome3,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        onLift,
        droppable: preset.home,
        viewport: preset.viewport,
      });
      const offsetFromHome: Position = getNewHomeClientOffset({
        impact: mergingWithInHome3,
        draggable: preset.inHome1,
        dimensions: preset.dimensions,
        viewport: preset.viewport,
        onLift,
      });

      const diff: Position = subtract(
        currentClientCenter,
        preset.inHome1.client.borderBox.center,
      );
      const withCollapsingHome: Position = subtract(diff, displacedBy.point);
      expect(offsetFromHome).toEqual(withCollapsingHome);
    });

    it('should account for the scroll of your home list if you are not over any list', () => {
      const scrollableHome: DroppableDimension = makeScrollable(preset.home);
      const scroll: Position = { x: 10, y: 15 };
      const displacement: Position = negate(scroll);
      const scrolled: DroppableDimension = scrollDroppable(
        scrollableHome,
        scroll,
      );
      const withScrolledHome: DimensionMap = patchDroppableMap(
        preset.dimensions,
        scrolled,
      );

      const withScroll: Position = getNewHomeClientOffset({
        impact: noImpact,
        draggable: preset.inHome1,
        dimensions: withScrolledHome,
        viewport: preset.viewport,
        onLift,
      });
      const withoutScroll: Position = getNewHomeClientOffset({
        impact: noImpact,
        draggable: preset.inHome1,
        // no droppable scroll
        dimensions: preset.dimensions,
        viewport: preset.viewport,
        onLift,
      });

      const diff: Position = subtract(withScroll, withoutScroll);

      expect(diff).toEqual(displacement);
    });
  });
});
