// @flow
import type { Position } from 'css-box-model';
import { horizontal, vertical } from '../../../../../src/state/axis';
import getDisplacementMap from '../../../../../src/state/get-displacement-map';
import getDragImpact from '../../../../../src/state/get-drag-impact';
import noImpact from '../../../../../src/state/no-impact';
import { patch } from '../../../../../src/state/position';
import { getPreset } from '../../../../utils/dimension';
import type {
  Axis,
  DragImpact,
  UserDirection,
  Displacement,
} from '../../../../../src/types';

const dontCareAboutDirection: UserDirection = {
  vertical: 'down',
  horizontal: 'right',
};

[(vertical, horizontal)].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    // moving inHome2 forwards past inHome4
    describe('moving beyond start position', () => {
      describe('is user moving forwards', () => {});
      describe('is user moving backwards', () => {});
      const pageBorderBoxCenter: Position = patch(
        axis.line,
        preset.inHome4.page.borderBox[axis.start] + 1,
        // no change
        preset.inHome2.page.borderBox.center[axis.crossAxisLine],
      );
      const displaced: Displacement[] = [
        {
          draggableId: preset.inHome4.descriptor.id,
          isVisible: true,
          shouldAnimate: true,
        },
        {
          draggableId: preset.inHome3.descriptor.id,
          isVisible: true,
          shouldAnimate: true,
        },
      ];
      const expected: DragImpact = {
        movement: {
          amount: patch(axis.line, preset.inHome2.page.marginBox[axis.size]),
          // ordered by closest to current location
          displaced,
          map: getDisplacementMap(displaced),
          isBeyondStartPosition: true,
        },
        direction: axis.direction,
        destination: {
          droppableId: preset.home.descriptor.id,
          // is now after inHome4
          index: 3,
        },
        group: null,
      };

      const impact: DragImpact = getDragImpact({
        pageBorderBoxCenter,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: noImpact,
        viewport: preset.viewport,
        direction: dontCareAboutDirection,
      });

      expect(impact).toEqual(expected);
    });
  });
});
