// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  DroppableDimension,
  DroppableDimensionMap,
} from '../../../../../src/types';
import { vertical, horizontal } from '../../../../../src/state/axis';
import scrollDroppable from '../../../../../src/state/droppable/scroll-droppable';
import getDragImpact from '../../../../../src/state/get-drag-impact';
import getHomeImpact from '../../../../../src/state/get-home-impact';
import { patch } from '../../../../../src/state/position';
import { forward } from '../../../../../src/state/user-direction/user-direction-preset';
import { getPreset, makeScrollable } from '../../../../utils/dimension';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const homeImpact: DragImpact = getHomeImpact(preset.inHome1, preset.home);
    const withCombineEnabled: DroppableDimension = {
      ...preset.home,
      isCombineEnabled: true,
    };
    const scrollableHome: DroppableDimension = makeScrollable(
      withCombineEnabled,
    );
    const scroll: Position = patch(axis.line, 1);
    const scrolled: DroppableDimension = scrollDroppable(
      scrollableHome,
      scroll,
    );
    const withoutScrolled: DroppableDimensionMap = {
      ...preset.droppables,
      [preset.home.descriptor.id]: scrollableHome,
    };
    const withScrolled: DroppableDimensionMap = {
      ...preset.droppables,
      [preset.home.descriptor.id]: scrolled,
    };
    const beforeStart: Position = patch(
      axis.line,
      preset.inHome2.page.borderBox[axis.start] - 1,
      preset.inHome2.page.borderBox.center[axis.crossAxisLine],
    );

    it('should take into account droppable scroll', () => {
      // no combine without droppable scroll
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: beforeStart,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: withoutScrolled,
          previousImpact: homeImpact,
          viewport: preset.viewport,
          userDirection: forward,
        });

        expect(impact.merge).toEqual(null);
      }
      // combine now due to do droppable scroll
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: beforeStart,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: withScrolled,
          previousImpact: homeImpact,
          viewport: preset.viewport,
          userDirection: forward,
        });

        const expected: DragImpact = {
          movement: homeImpact.movement,
          direction: axis.direction,
          destination: null,
          merge: {
            whenEntered: forward,
            combine: {
              draggableId: preset.inHome2.descriptor.id,
              droppableId: preset.home.descriptor.id,
            },
          },
        };
        expect(impact).toEqual(expected);
      }
    });
  });
});
