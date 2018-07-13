// @flow
import {
  offset,
  withScroll,
  type BoxModel,
  type Position,
} from 'css-box-model';
import invariant from 'tiny-invariant';
import getStatePreset from '../../../utils/get-simple-state-preset';
import type {
  Published,
  DraggableId,
  DroppableId,
  DropPendingState,
  DraggingState,
  DimensionMap,
  CollectingState,
} from '../../../../src/types';
import publish from '../../../../src/state/publish';
import { getPreset } from '../../../utils/dimension';
import { patch, negate } from '../../../../src/state/position';
import { copy } from '../../../utils/preset-action-args';

const state = getStatePreset();
const preset = getPreset();

const empty: Published = {
  additions: {
    draggables: [],
    droppables: [],
  },
  removals: {
    draggables: [],
    droppables: [],
  },
};

const original: CollectingState = state.collecting();
const published: Published = {
  ...empty,
  removals: {
    draggables: preset.inForeignList.map(d => d.descriptor.id),
    droppables: [preset.foreign.descriptor.id],
  },
};
const expected: DimensionMap = copy(preset.dimensions);

published.removals.draggables.forEach((id: DraggableId) => {
  delete expected.draggables[id];
});

published.removals.droppables.forEach((id: DroppableId) => {
  delete expected.droppables[id];
});

it('should remove any removed draggables and droppables', () => {
  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  invariant(result.phase === 'DRAGGING');
  expect(result.dimensions).toEqual(expected);
});
