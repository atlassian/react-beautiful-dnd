// @flow
import type { Position } from 'css-box-model';
import { horizontal, vertical } from '../../../../../src/state/axis';
import getDragImpact from '../../../../../src/state/get-drag-impact';
import noImpact from '../../../../../src/state/no-impact';
import { patch } from '../../../../../src/state/position';
import { getPreset } from '../../../../utils/dimension';
import type { Axis, DragImpact, UserDirection } from '../../../../../src/types';

const dontCareAboutDirection: UserDirection = {
  vertical: 'down',
  horizontal: 'right',
};

[(vertical, horizontal)].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    // moving inHome1 no where
    it('should return no impact when moving over original position', () => {
      const pageBorderBoxCenter: Position =
        preset.inHome1.page.borderBox.center;
      const expected: DragImpact = {
        movement: {
          displaced: [],
          map: {},
          amount: patch(axis.line, preset.inHome1.page.marginBox[axis.size]),
          isBeyondStartPosition: false,
        },
        direction: axis.direction,
        destination: {
          droppableId: preset.home.descriptor.id,
          index: 0,
        },
        group: null,
      };

      const impact: DragImpact = getDragImpact({
        pageBorderBoxCenter,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: noImpact,
        viewport: preset.viewport,
        direction: dontCareAboutDirection,
      });

      expect(impact).toEqual(expected);
    });

    // moving inHome1 forward towards but not past inHome2
    it('should return no impact when it has not moved enough to impact others', () => {
      const pageBorderBoxCenter: Position = patch(
        axis.line,
        // up to the line but not over it
        preset.inHome2.page.borderBox[axis.start],
        // no movement on cross axis
        preset.inHome1.page.borderBox.center[axis.crossAxisLine],
      );
      const expected: DragImpact = {
        movement: {
          amount: patch(axis.line, preset.inHome1.page.marginBox[axis.size]),
          displaced: [],
          map: {},
          isBeyondStartPosition: true,
        },
        direction: axis.direction,
        destination: {
          droppableId: preset.home.descriptor.id,
          index: 0,
        },
        group: null,
      };

      const impact: DragImpact = getDragImpact({
        pageBorderBoxCenter,
        draggable: preset.inHome1,
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
