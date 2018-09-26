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

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    const forwardsOnAxis: UserDirection = {
      vertical: axis === vertical ? 'down' : 'up',
      horizontal: axis === horizontal ? 'right' : 'left',
    };
    const backwardsOnAxis: UserDirection = {
      vertical: axis === vertical ? 'up' : 'down',
      horizontal: axis === horizontal ? 'left' : 'right',
    };

    // moving inHome2 forwards past inHome4
    describe('is user moving forwards - further away from the start position', () => {
      it('should displace an item when the center position moves of the start edge of another', () => {
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
            isInFrontOfStart: true,
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
          direction: forwardsOnAxis,
        });

        expect(impact).toEqual(expected);
      });
    });

    describe('is user moving backwards - closer to the start position', () => {
      it('should displace an item if the current center is greater than the end of the of a non-displaced item', () => {
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
            isInFrontOfStart: true,
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
          direction: backwardsOnAxis,
        });

        expect(impact).toEqual(expected);
      });

      it('should stop displacing an item if the current center is greater than the displaced end edge', () => {});
    });
  });
});
