// @flow
import type { Position } from 'css-box-model';
import { vertical, horizontal } from '../../../../../src/state/axis';
import getPageBorderBoxCenter from '../../../../../src/state/get-center-from-impact/get-page-border-box-center';
import getHomeOnLift from '../../../../../src/state/get-home-on-lift';
import { getPreset } from '../../../../utils/dimension';
import type { Axis } from '../../../../../src/types';

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
      const result: Position = getPageBorderBoxCenter({
        impact: homeImpact,
        draggable: preset.inHome1,
        droppable: preset.home,
        draggables: preset.dimensions.draggables,
        onLift,
      });

      expect(result).toEqual(original);
    });
  });
});
