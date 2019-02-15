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
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import { negate, add } from '../../../../../../src/state/position';
import scrollDroppable from '../../../../../../src/state/droppable/scroll-droppable';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';
import { forward } from '../../../../../../src/state/user-direction/user-direction-preset';
import getNotAnimatedDisplacement from '../../../../../utils/get-displacement/get-not-animated-displacement';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const withCombineEnabled: DroppableDimension = {
      ...preset.home,
      isCombineEnabled: true,
    };
    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome1.displaceBy,
    );
    const { onLift } = getHomeOnLift({
      draggable: preset.inHome1,
      home: withCombineEnabled,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });

    it('should account for any scroll in the droppable being dropped into (into foreign list)', () => {
      // combining with inHome2
      const displaced: Displacement = [
        getNotAnimatedDisplacement(preset.inHome2),
        getNotAnimatedDisplacement(preset.inHome3),
        getNotAnimatedDisplacement(preset.inHome4),
      ];
      const impact: DragImpact = {
        movement: {
          displacedBy,
          displaced,
          map: getDisplacementMap(displaced),
        },
        direction: axis.direction,
        destination: null,
        merge: {
          whenEntered: forward,
          // combining with inHome2
          combine: {
            draggableId: preset.inHome2.descriptor.id,
            droppableId: preset.inHome2.descriptor.droppableId,
          },
        },
      };

      const inHome2Center: Position = preset.inHome2.page.borderBox.center;
      // without any scroll
      {
        const result: Position = getPageBorderBoxCenter({
          impact,
          onLift,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppable: withCombineEnabled,
        });

        expect(result).toEqual(inHome2Center);
      }
      // into start of empty foreign list (with scroll)
      {
        const scroll: Position = { x: 10, y: 20 };
        const displacement: Position = negate(scroll);
        const scrollable: DroppableDimension = makeScrollable(
          withCombineEnabled,
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

        expect(result).toEqual(add(inHome2Center, displacement));
      }
    });
  });
});
