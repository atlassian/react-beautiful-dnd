// @flow
import type { Position } from 'css-box-model';
import { horizontal, vertical } from '../../../../../src/state/axis';
import getDragImpact from '../../../../../src/state/get-drag-impact';
import noImpact from '../../../../../src/state/no-impact';
import { disableDroppable, getPreset } from '../../../../utils/dimension';
import type {
  Axis,
  DroppableDimension,
  DroppableDimensionMap,
  DragImpact,
  UserDirection,
} from '../../../../../src/types';

const dontCareAboutDirection: UserDirection = {
  vertical: 'down',
  horizontal: 'right',
};

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    it('should return no impact when home is disabled', () => {
      const disabled: DroppableDimension = disableDroppable(preset.home);
      const withDisabled: DroppableDimensionMap = {
        ...preset.droppables,
        [disabled.descriptor.id]: disabled,
      };
      // choosing the center of inHome2 which should have an impact
      const pageBorderBoxCenter: Position =
        preset.inHome2.page.borderBox.center;

      const impact: DragImpact = getDragImpact({
        pageBorderBoxCenter,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: withDisabled,
        previousImpact: noImpact,
        viewport: preset.viewport,
        direction: dontCareAboutDirection,
      });

      expect(impact).toEqual(noImpact);
    });
  });
});
