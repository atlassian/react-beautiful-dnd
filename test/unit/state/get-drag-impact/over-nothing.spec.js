// @flow
import type { Position } from 'css-box-model';
import { horizontal, vertical } from '../../../../src/state/axis';
import getDragImpact from '../../../../src/state/get-drag-impact';
import noImpact from '../../../../src/state/no-impact';
import { getPreset } from '../../../utils/dimension';
import type { Axis, DragImpact } from '../../../../src/types';
import { forward } from '../../../../src/state/user-direction/user-direction-preset';
import getHomeOnLift from '../../../../src/state/get-home-on-lift';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    it('should return no impact when not dragging over anything', () => {
      // dragging up above the list
      const farAway: Position = {
        x: 1000,
        y: 1000,
      };
      const { onLift, impact: homeImpact } = getHomeOnLift({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });

      const impact: DragImpact = getDragImpact({
        pageBorderBoxCenter: farAway,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: homeImpact,
        viewport: preset.viewport,
        userDirection: forward,
        onLift,
      });

      expect(impact).toEqual(noImpact);
    });
  });
});
