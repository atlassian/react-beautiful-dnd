// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  DisplacedBy,
  DroppableDimension,
} from '../../../../../../src/types';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import getPageBorderBoxCenter from '../../../../../../src/state/get-center-from-impact/get-page-border-box-center';
import getHomeOnLift from '../../../../../../src/state/get-home-on-lift';
import { getPreset, makeScrollable } from '../../../../../utils/dimension';
import { goIntoStart } from '../../../../../../src/state/get-center-from-impact/move-relative-to';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import { negate, add } from '../../../../../../src/state/position';
import scrollDroppable from '../../../../../../src/state/droppable/scroll-droppable';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    it('should account for any scroll in the droppable being dropped into (into foreign list)', () => {
      // inHome1 over the end of empty
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome1.displaceBy,
      );
      const { onLift } = getHomeOnLift({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const impact: DragImpact = {
        movement: {
          displacedBy,
          displaced: [],
          map: {},
        },
        // moving into the last position
        destination: {
          index: 0,
          droppableId: preset.emptyForeign.descriptor.id,
        },
        merge: null,
      };
      const expectedCenter: Position = goIntoStart({
        axis,
        moveInto: preset.emptyForeign.page,
        isMoving: preset.inHome1.page,
      });
      // into start of empty foreign list (without scroll)
      {
        const result: Position = getPageBorderBoxCenter({
          impact,
          draggable: preset.inHome1,
          draggables: preset.dimensions.draggables,
          droppable: preset.emptyForeign,
          onLift,
        });

        expect(result).toEqual(expectedCenter);
      }
      // into start of empty foreign list (with scroll)
      {
        const scroll: Position = { x: 10, y: 20 };
        const displacement: Position = negate(scroll);
        const scrollable: DroppableDimension = makeScrollable(
          preset.emptyForeign,
        );
        const scrolled: DroppableDimension = scrollDroppable(
          scrollable,
          scroll,
        );

        const result: Position = getPageBorderBoxCenter({
          impact,
          draggable: preset.inHome1,
          draggables: preset.dimensions.draggables,
          droppable: scrolled,
          onLift,
        });

        expect(result).toEqual(add(expectedCenter, displacement));
      }
    });
  });
});
