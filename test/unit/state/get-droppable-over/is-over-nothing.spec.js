// @flow
import type { DroppableId } from '../../../../src/types';
import getDroppableOver from '../../../../src/state/get-droppable-over';
import { getPreset } from '../../../util/dimension';

const preset = getPreset();

it('should return null when over nothing', () => {
  const result: ?DroppableId = getDroppableOver({
    pageOffset: { x: 10000, y: 10000 },
    draggable: preset.inHome1,
    droppables: preset.droppables,
  });

  expect(result).toBe(null);
});
