// @flow
import type { Position } from 'css-box-model';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import getPageBorderBoxCenter from '../../../../../../src/state/get-center-from-impact/get-page-border-box-center';
import getHomeOnLift from '../../../../../../src/state/get-home-on-lift';
import { getPreset } from '../../../../../utils/dimension';
import type { Axis } from '../../../../../../src/types';
import { goIntoStart } from '../../../../../../src/state/get-center-from-impact/move-relative-to';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const { onLift, impact: homeImpact } = getHomeOnLift({
      draggable: preset.inHome1,
      home: preset.home,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });

    it('should move into the start of the list', () => {
      const result: Position = getPageBorderBoxCenter({
        impact: homeImpact,
        onLift,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppable: preset.emptyForeign,
      });

      const expected: Position = goIntoStart({
        axis,
        moveInto: preset.emptyForeign.page,
        isMoving: preset.inHome1.page,
      });
      expect(result).toEqual(expected);
    });
  });
});
