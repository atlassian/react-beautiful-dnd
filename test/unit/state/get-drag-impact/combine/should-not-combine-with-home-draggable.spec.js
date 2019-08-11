// @flow
import type {
  Axis,
  DragImpact,
  DroppableDimensionMap,
} from '../../../../../src/types';
import { horizontal, vertical } from '../../../../../src/state/axis';
import getDragImpact from '../../../../../src/state/get-drag-impact';
import getLiftEffect from '../../../../../src/state/get-lift-effect';
import { forward } from '../../../../../src/state/user-direction/user-direction-preset';
import { enableCombining, getPreset } from '../../../../util/dimension';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    it('should not allow combining with the dragging item', () => {
      const { afterCritical, impact: homeImpact } = getLiftEffect({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const withCombineEnabled: DroppableDimensionMap = enableCombining(
        preset.droppables,
      );

      // from the home impact

      const impact: DragImpact = getDragImpact({
        pageBorderBoxCenter: preset.inHome1.page.borderBox.center,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: withCombineEnabled,
        previousImpact: homeImpact,
        viewport: preset.viewport,
        userDirection: forward,
        afterCritical,
      });
      expect(impact).toEqual(homeImpact);
    });
  });
});
