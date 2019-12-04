// @flow
import type { DroppableId } from '../../../../src/types';
import getDroppableOver from '../../../../src/state/get-droppable-over';
import { getPreset } from '../../../util/dimension';
import { offsetRectByPosition } from '../../../../src/state/rect';

const preset = getPreset();

it('should return null when over nothing', () => {
  const result: ?DroppableId = getDroppableOver({
    pageBorderBox: offsetRectByPosition(preset.inHome1.page.borderBox, {
      x: 10000,
      y: 10000,
    }),
    draggable: preset.inHome1,
    droppables: preset.droppables,
  });

  expect(result).toBe(null);
});
