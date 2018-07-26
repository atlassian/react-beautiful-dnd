// @flow
import invariant from 'tiny-invariant';
import getStatePreset from '../../../utils/get-simple-state-preset';
import type {
  Published,
  DraggableId,
  DraggableDimension,
  DropPendingState,
  DraggingState,
  DimensionMap,
  CollectingState,
} from '../../../../src/types';
import publish from '../../../../src/state/publish';
import { getPreset } from '../../../utils/dimension';
import { copy } from '../../../utils/preset-action-args';
import { empty, withScrollables, scrollableForeign } from './util';

const state = getStatePreset();
const preset = getPreset();

const original: CollectingState = withScrollables(state.collecting());
const published: Published = {
  ...empty,
  removals: preset.inForeignList.map(
    (draggable: DraggableDimension): DraggableId => draggable.descriptor.id,
  ),
  modified: [scrollableForeign],
};
const expected: DimensionMap = copy(original.dimensions);

published.removals.forEach((id: DraggableId) => {
  delete expected.draggables[id];
});

it('should remove any removed draggables and droppables', () => {
  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  invariant(result.phase === 'DRAGGING');
  expect(result.dimensions).toEqual(expected);
});
