// @flow
import type { Position } from 'css-box-model';
import type { Axis } from '../../../../../../src/types';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import getPageBorderBoxCenter from '../../../../../../src/state/get-center-from-impact/get-page-border-box-center';
import getLiftEffect from '../../../../../../src/state/get-lift-effect';
import { getPreset } from '../../../../../util/dimension';
import { goIntoStart } from '../../../../../../src/state/get-center-from-impact/move-relative-to';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const { afterCritical, impact: homeImpact } = getLiftEffect({
      draggable: preset.inHome1,
      home: preset.home,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });

    it('should move into the start of the list', () => {
      const result: Position = getPageBorderBoxCenter({
        impact: homeImpact,
        afterCritical,
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
