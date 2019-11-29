// @flow
import type { DroppableDimensionMap, DroppableId } from '../../../../src/types';
import getDroppableOver from '../../../../src/state/get-droppable-over';
import { disableDroppable, getPreset } from '../../../util/dimension';
import { origin } from '../../../../src/state/position';

const preset = getPreset();

it('should not consider lists that are disabled', () => {
  const withDisabled: DroppableDimensionMap = {
    ...preset.droppables,
    [preset.home.descriptor.id]: disableDroppable(preset.home),
  };

  const whileEnabled: ?DroppableId = getDroppableOver({
    pageOffset: origin,
    draggable: preset.inHome1,
    droppables: preset.droppables,
  });
  const whileDisabled: ?DroppableId = getDroppableOver({
    pageOffset: origin,
    draggable: preset.inHome1,
    droppables: withDisabled,
  });

  expect(whileEnabled).toBe(preset.home.descriptor.id);
  expect(whileDisabled).toBe(null);
});
