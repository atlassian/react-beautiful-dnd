// @flow
import type { DroppableDimensionMap, DroppableId } from '../../../../src/types';
import getDroppableOver from '../../../../src/state/get-droppable-over';
import { disableDroppable, getPreset } from '../../../util/dimension';

const preset = getPreset();

it('should not consider lists that are disabled', () => {
  const withDisabled: DroppableDimensionMap = {
    ...preset.droppables,
    [preset.home.descriptor.id]: disableDroppable(preset.home),
  };

  const whileEnabled: ?DroppableId = getDroppableOver({
    pageBorderBox: preset.inHome1.page.borderBox,
    draggable: preset.inHome1,
    droppables: preset.droppables,
    currentSelection: { x: 0, y: 0 },
    calculateDroppableUsingPointerPosition: false,
  });
  const whileDisabled: ?DroppableId = getDroppableOver({
    pageBorderBox: preset.inHome1.page.borderBox,
    draggable: preset.inHome1,
    droppables: withDisabled,
    currentSelection: { x: 0, y: 0 },
    calculateDroppableUsingPointerPosition: false,
  });

  expect(whileEnabled).toBe(preset.home.descriptor.id);
  expect(whileDisabled).toBe(null);
});
