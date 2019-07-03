// @flow
import type { Position } from 'css-box-model';
import { horizontal, vertical } from '../../../../../src/state/axis';
import getPageBorderBoxCenter from '../../../../../src/state/get-center-from-impact/get-page-border-box-center';
import getLiftEffect from '../../../../../src/state/get-lift-effect';
import { getPreset } from '../../../../utils/dimension';
import type { Axis } from '../../../../../src/types';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const original: Position = preset.inHome1.page.borderBox.center;
    const { afterCritical, impact: homeImpact } = getLiftEffect({
      draggable: preset.inHome1,
      home: preset.home,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });

    it('should return original center when not over anything', () => {
      const result: Position = getPageBorderBoxCenter({
        impact: homeImpact,
        draggable: preset.inHome1,
        droppable: null,
        draggables: preset.dimensions.draggables,
        afterCritical,
      });

      expect(result).toEqual(original);
    });
  });
});
