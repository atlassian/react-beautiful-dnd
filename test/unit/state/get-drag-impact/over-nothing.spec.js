// @flow
import type { Position } from 'css-box-model';
import { horizontal, vertical } from '../../../../src/state/axis';
import getDragImpact from '../../../../src/state/get-drag-impact';
import noImpact from '../../../../src/state/no-impact';
import { getPreset } from '../../../util/dimension';
import type { Axis, DragImpact } from '../../../../src/types';
import getLiftEffect from '../../../../src/state/get-lift-effect';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    it('should return no impact when not dragging over anything', () => {
      // dragging up above the list
      const farAway: Position = {
        x: 10000,
        y: 10000,
      };
      const { afterCritical, impact: homeImpact } = getLiftEffect({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });

      const impact: DragImpact = getDragImpact({
        pageOffset: farAway,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: homeImpact,
        viewport: preset.viewport,
        afterCritical,
      });

      expect(impact).toEqual(noImpact);
    });
  });
});
