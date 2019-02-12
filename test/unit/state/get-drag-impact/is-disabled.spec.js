// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  DroppableDimension,
  DroppableDimensionMap,
  DragImpact,
  UserDirection,
} from '../../../../src/types';
import { horizontal, vertical } from '../../../../src/state/axis';
import getDragImpact from '../../../../src/state/get-drag-impact';
import noImpact from '../../../../src/state/no-impact';
import { disableDroppable, getPreset } from '../../../utils/dimension';
import getHomeOnLift from '../../../../src/state/get-home-on-lift';

const dontCareAboutDirection: UserDirection = {
  vertical: 'down',
  horizontal: 'right',
};

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    const { onLift, impact: homeImpact } = getHomeOnLift({
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

      // choosing the center of inHome2 which should have an impact
      const pageBorderBoxCenter: Position =
        preset.inHome2.page.borderBox.center;

      const impact: DragImpact = getDragImpact({
        pageBorderBoxCenter,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: withDisabled,
        previousImpact: homeImpact,
        viewport: preset.viewport,
        userDirection: dontCareAboutDirection,
        onLift,
      });

      expect(impact).toEqual(noImpact);
    });

    it('should return no impact when foreign is disabled', () => {
      const disabled: DroppableDimension = disableDroppable(preset.foreign);
      const withDisabled: DroppableDimensionMap = {
        ...preset.droppables,
        [disabled.descriptor.id]: disabled,
      };
      // choosing the center of inForeign2 which should have an impact
      const pageBorderBoxCenter: Position =
        preset.inForeign2.page.borderBox.center;

      const impact: DragImpact = getDragImpact({
        pageBorderBoxCenter,
        draggable: preset.inForeign1,
        draggables: preset.draggables,
        droppables: withDisabled,
        previousImpact: homeImpact,
        viewport: preset.viewport,
        userDirection: dontCareAboutDirection,
        onLift,
      });

      expect(impact).toEqual(noImpact);
    });
  });
});
