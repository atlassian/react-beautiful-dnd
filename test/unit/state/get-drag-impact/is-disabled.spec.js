// @flow
import type {
  Axis,
  DroppableDimension,
  DroppableDimensionMap,
  DragImpact,
} from '../../../../src/types';
import { horizontal, vertical } from '../../../../src/state/axis';
import getDragImpact from '../../../../src/state/get-drag-impact';
import noImpact from '../../../../src/state/no-impact';
import { disableDroppable, getPreset } from '../../../util/dimension';
import getLiftEffect from '../../../../src/state/get-lift-effect';
import { origin } from '../../../../src/state/position';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    const { afterCritical, impact: homeImpact } = getLiftEffect({
      draggable: preset.inHome1,
      home: preset.home,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });

    it('should return no impact when home is disabled', () => {
      const disabled: DroppableDimension = disableDroppable(preset.home);
      const withDisabled: DroppableDimensionMap = {
        ...preset.droppables,
        [disabled.descriptor.id]: disabled,
      };

      const impact: DragImpact = getDragImpact({
        // no change - should still be in same spot
        pageOffset: origin,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: withDisabled,
        previousImpact: homeImpact,
        viewport: preset.viewport,
        afterCritical,
      });

      expect(impact).toEqual(noImpact);
    });

    it('should return no impact when foreign is disabled', () => {
      const disabled: DroppableDimension = disableDroppable(preset.foreign);
      const withDisabled: DroppableDimensionMap = {
        ...preset.droppables,
        [disabled.descriptor.id]: disabled,
      };

      const impact: DragImpact = getDragImpact({
        pageOffset: origin,
        draggable: preset.inForeign1,
        draggables: preset.draggables,
        droppables: withDisabled,
        previousImpact: homeImpact,
        viewport: preset.viewport,
        afterCritical,
      });

      expect(impact).toEqual(noImpact);
    });
  });
});
