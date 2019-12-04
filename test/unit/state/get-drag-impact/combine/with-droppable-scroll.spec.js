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
import getLiftEffect from '../../../../../src/state/get-lift-effect';
import { patch, add } from '../../../../../src/state/position';
import { getPreset, makeScrollable } from '../../../../util/dimension';
import { getThreshold } from '../util/get-combine-threshold';
import { getOffsetForEndEdge } from '../util/get-offset-for-edge';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    const withCombineEnabled: DroppableDimension = {
      ...preset.home,
      isCombineEnabled: true,
    };
    const scrollableHome: DroppableDimension = makeScrollable(
      withCombineEnabled,
    );
    const { afterCritical, impact: homeImpact } = getLiftEffect({
      draggable: preset.inHome1,
      home: scrollableHome,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });
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
    const startOfInHome2: Position = patch(
      axis.line,
      preset.inHome2.page.borderBox[axis.start],
      preset.inHome2.page.borderBox.center[axis.crossAxisLine],
    );
    const threshold: Position = getThreshold(axis, preset.inHome2);
    const combineStart: Position = add(startOfInHome2, threshold);
    const offsetForOnCombineStart: Position = getOffsetForEndEdge({
      endEdgeOn: combineStart,
      dragging: preset.inHome1.page.borderBox,
      axis,
    });

    it('should take into account droppable scroll', () => {
      // no combine without droppable scroll
      {
        const impact: DragImpact = getDragImpact({
          pageOffset: offsetForOnCombineStart,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: withoutScrolled,
          previousImpact: homeImpact,
          viewport: preset.viewport,
          afterCritical,
        });

        expect(impact.at).toHaveProperty('type', 'REORDER');
      }
      // combine now due to do droppable scroll
      {
        const impact: DragImpact = getDragImpact({
          pageOffset: offsetForOnCombineStart,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: withScrolled,
          previousImpact: homeImpact,
          viewport: preset.viewport,
          afterCritical,
        });

        const expected: DragImpact = {
          displaced: homeImpact.displaced,
          displacedBy: homeImpact.displacedBy,
          at: {
            type: 'COMBINE',
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
