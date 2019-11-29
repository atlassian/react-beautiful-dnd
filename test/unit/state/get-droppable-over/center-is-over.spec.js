// @flow
import type { Position, Rect } from 'css-box-model';
import type {
  Axis,
  DroppableId,
  DraggableDimension,
} from '../../../../src/types';
import { vertical, horizontal } from '../../../../src/state/axis';
import { getPreset } from '../../../util/dimension';
import { getCorners, expandByPosition } from '../../../../src/state/spacing';
import getDroppableOver from '../../../../src/state/get-droppable-over';
import { invariant } from '../../../../src/invariant';
import { subtract, patch } from '../../../../src/state/position';
import { offsetRectByPosition } from '../../../../src/state/rect';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const active: ?Rect = preset.home.subject.active;
    invariant(active, 'expected active');
    const draggable: DraggableDimension = preset.inHome1;

    it('should return a list when the center is over the list', () => {
      const corners: Position[] = getCorners(active);

      corners.forEach((corner: Position) => {
        const pageOffset: Position = subtract(
          corner,
          draggable.page.borderBox.center,
        );
        const pageBorderBox: Rect = offsetRectByPosition(
          draggable.page.borderBox,
          pageOffset,
        );
        const result: ?DroppableId = getDroppableOver({
          pageBorderBox,
          draggable,
          droppables: preset.droppables,
        });

        expect(result).toBe(preset.home.descriptor.id);
      });

      const outside: Position[] = getCorners(
        expandByPosition(active, patch(axis.line, 1)),
      );

      outside.forEach((corner: Position) => {
        const pageOffset: Position = subtract(
          corner,
          draggable.page.borderBox.center,
        );
        const pageBorderBox: Rect = offsetRectByPosition(
          draggable.page.borderBox,
          pageOffset,
        );
        const result: ?DroppableId = getDroppableOver({
          pageBorderBox,
          draggable,
          droppables: preset.droppables,
        });

        expect(result).toBe(null);
      });
    });
  });
});
