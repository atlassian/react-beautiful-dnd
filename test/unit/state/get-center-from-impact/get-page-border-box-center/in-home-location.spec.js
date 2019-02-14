// @flow
import type { Position } from 'css-box-model';
import { vertical, horizontal } from '../../../../../src/state/axis';
import getPageBorderBoxCenter from '../../../../../src/state/get-center-from-impact/get-page-border-box-center';
import getHomeOnLift from '../../../../../src/state/get-home-on-lift';
import { getPreset } from '../../../../utils/dimension';
import type { Axis } from '../../../../../src/types';
import { goBefore } from '../../../../../src/state/get-center-from-impact/move-relative-to';
import { patch, subtract } from '../../../../../src/state/position';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const original: Position = preset.inHome1.page.borderBox.center;
    const { onLift, impact: homeImpact } = getHomeOnLift({
      draggable: preset.inHome1,
      home: preset.home,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });

    it('should return original center when not over anything', () => {
      // our fake data does not line up visible edges correctly so the position is a little off
      const concession: Position = goBefore({
        axis,
        moveRelativeTo: preset.inHome2.page,
        isMoving: preset.inHome1.page,
      });

      const result: Position = getPageBorderBoxCenter({
        impact: homeImpact,
        draggable: preset.inHome1,
        droppable: preset.home,
        draggables: preset.dimensions.draggables,
        onLift,
      });

      expect(result).toEqual(concession);

      // cause of mismatch: they do not line up on the marginbox line
      {
        expect(preset.inHome1.page.marginBox[axis.end]).not.toEqual(
          preset.inHome2.page.marginBox[axis.start],
        );
        const diff: Position = patch(
          axis.line,
          preset.inHome1.page.marginBox[axis.end] -
            preset.inHome2.page.marginBox[axis.start],
        );
        expect(subtract(original, concession)).toEqual(diff);
      }
    });
  });
});
