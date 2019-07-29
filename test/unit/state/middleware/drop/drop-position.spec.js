// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  Axis,
  DragImpact,
  DisplacedBy,
  DimensionMap,
} from '../../../../../src/types';
import { vertical, horizontal } from '../../../../../src/state/axis';
import { negate, subtract, origin } from '../../../../../src/state/position';
import scrollDroppable from '../../../../../src/state/droppable/scroll-droppable';
import { getPreset, makeScrollable } from '../../../../utils/dimension';
import getClientBorderBoxCenter from '../../../../../src/state/get-center-from-impact/get-client-border-box-center';
import getDisplacedBy from '../../../../../src/state/get-displaced-by';
import { forward } from '../../../../../src/state/user-direction/user-direction-preset';
import noImpact from '../../../../../src/state/no-impact';
import getLiftEffect from '../../../../../src/state/get-lift-effect';
import getNewHomeClientOffset from '../../../../../src/state/middleware/drop/get-new-home-client-offset';
import patchDimensionMap from '../../../../../src/state/patch-dimension-map';
import { getForcedDisplacement } from '../../../../utils/impact';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const { afterCritical, impact: homeImpact } = getLiftEffect({
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
        afterCritical,
      });

      expect(offset).toEqual(origin);
    });

    it('should return the difference between the current client position and where it needs to be', () => {
      // inHome1 in inHome2 position
      const pastInHome2: DragImpact = {
        displaced: getForcedDisplacement({
          visible: [
            { dimension: preset.inHome3, shouldAnimate: false },
            { dimension: preset.inHome4, shouldAnimate: false },
          ],
        }),
        displacedBy,
        at: {
          type: 'REORDER',
          destination: {
            index: preset.inHome2.descriptor.index,
            droppableId: preset.home.descriptor.id,
          },
        },
      };

      const currentClientCenter: Position = getClientBorderBoxCenter({
        impact: pastInHome2,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        afterCritical,
        droppable: preset.home,
        viewport: preset.viewport,
      });
      const offsetFromHome: Position = getNewHomeClientOffset({
        impact: pastInHome2,
        draggable: preset.inHome1,
        dimensions: preset.dimensions,
        viewport: preset.viewport,
        afterCritical,
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
      const mergingWithInHome3: DragImpact = {
        displacedBy,
        displaced: getForcedDisplacement({
          // inHome2 is no longer displaced
          visible: [
            { dimension: preset.inHome3, shouldAnimate: false },
            { dimension: preset.inHome4, shouldAnimate: false },
          ],
        }),
        at: {
          type: 'COMBINE',
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
        afterCritical,
        droppable: preset.home,
        viewport: preset.viewport,
      });
      const offsetFromHome: Position = getNewHomeClientOffset({
        impact: mergingWithInHome3,
        draggable: preset.inHome1,
        dimensions: preset.dimensions,
        viewport: preset.viewport,
        afterCritical,
      });
      const offset: Position = subtract(
        currentClientCenter,
        preset.inHome1.client.borderBox.center,
      );

      expect(offsetFromHome).toEqual(offset);
    });

    it('should account for the scroll of your home list if you are not over any list', () => {
      const scrollableHome: DroppableDimension = makeScrollable(preset.home);
      const scroll: Position = { x: 10, y: 15 };
      const displacement: Position = negate(scroll);
      const scrolled: DroppableDimension = scrollDroppable(
        scrollableHome,
        scroll,
      );
      const withScrolledHome: DimensionMap = patchDimensionMap(
        preset.dimensions,
        scrolled,
      );

      const withScroll: Position = getNewHomeClientOffset({
        impact: noImpact,
        draggable: preset.inHome1,
        dimensions: withScrolledHome,
        viewport: preset.viewport,
        afterCritical,
      });
      const withoutScroll: Position = getNewHomeClientOffset({
        impact: noImpact,
        draggable: preset.inHome1,
        // no droppable scroll
        dimensions: preset.dimensions,
        viewport: preset.viewport,
        afterCritical,
      });

      const diff: Position = subtract(withScroll, withoutScroll);

      expect(diff).toEqual(displacement);
    });
  });
});
