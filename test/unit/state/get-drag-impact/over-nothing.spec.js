// @flow
import type { Position } from 'css-box-model';
import { horizontal, vertical } from '../../../../src/state/axis';
import getDragImpact from '../../../../src/state/get-drag-impact';
import noImpact from '../../../../src/state/no-impact';
import getViewport from '../../../../src/view/window/get-viewport';
import { getPreset } from '../../../utils/dimension';
import type { Axis, DragImpact, Viewport } from '../../../../src/types';

const viewport: Viewport = getViewport();

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    it('should return no impact when not dragging over anything', () => {
      // dragging up above the list
      const farAway: Position = {
        x: 1000,
        y: 1000,
      };

      const impact: DragImpact = getDragImpact({
        pageBorderBoxCenter: farAway,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: noImpact,
        viewport,
        direction: {
          vertical: 'down',
          horizontal: 'right',
        },
      });

      expect(impact).toEqual(noImpact);
    });
  });
});
