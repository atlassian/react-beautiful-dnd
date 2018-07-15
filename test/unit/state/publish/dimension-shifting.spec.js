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
  DraggableDimension,
  DropPendingState,
  DraggingState,
  DraggableDimensionMap,
  CollectingState,
  DraggableId,
} from '../../../../src/types';
import publish from '../../../../src/state/publish';
import { getPreset } from '../../../utils/dimension';
import { patch, negate } from '../../../../src/state/position';
import getDraggablesInsideDroppable from '../../../../src/state/get-draggables-inside-droppable';
import { empty, shift } from './util';

const state = getStatePreset();
const preset = getPreset();

it('should do not modify the dimensions when nothing has changed', () => {
  const original: CollectingState = state.collecting();

  const result: DraggingState | DropPendingState = publish({
    state: original,
    published: empty,
  });

  invariant(result.phase === 'DRAGGING');
  expect(result.dimensions).toEqual(original.dimensions);
});

it('should not shift anything when draggables are added to the end of a list', () => {
  const added1: DraggableDimension = {
    ...preset.inHome4,
    descriptor: {
      ...preset.inHome4.descriptor,
      index: preset.inHome4.descriptor.index + 1,
      id: 'added1',
    },
  };
  const added2: DraggableDimension = {
    ...preset.inHome4,
    descriptor: {
      ...preset.inHome4.descriptor,
      index: preset.inHome4.descriptor.index + 2,
      id: 'added2',
    },
  };
  const published: Published = {
    ...empty,
    additions: {
      draggables: [added1, added2],
      droppables: [],
    },
  };

  const result: DraggingState | DropPendingState = publish({
    state: state.collecting(),
    published,
  });

  invariant(result.phase === 'DRAGGING');
  const expected: DraggableDimensionMap = {
    // everything else is unmodified
    ...preset.dimensions.draggables,
    // new dimensions added and not modified
    [added1.descriptor.id]: added1,
    [added2.descriptor.id]: added2,
  };
  expect(result.dimensions.draggables).toEqual(expected);
});

it('should not shift anything when draggables are removed from the end of the list', () => {
  const published: Published = {
    ...empty,
    removals: {
      // removing the last two draggables from inHome
      draggables: [preset.inHome3.descriptor.id, preset.inHome4.descriptor.id],
      droppables: [],
    },
  };

  const result: DraggingState | DropPendingState = publish({
    state: state.collecting(),
    published,
  });

  invariant(result.phase === 'DRAGGING');
  const expected: DraggableDimensionMap = {
    // everything else is unmodified
    ...preset.dimensions.draggables,
  };
  // removing the ones that we don't care about
  delete expected[preset.inHome3.descriptor.id];
  delete expected[preset.inHome4.descriptor.id];
  expect(result.dimensions.draggables).toEqual(expected);
});

it('should shift draggables after an added draggable', () => {
  // dragging the third item
  // insert a draggable into second position and into third position
  // assert everything after it is shifted and the first is not shifted
  const added1: DraggableDimension = {
    ...preset.inHome2,
    descriptor: {
      index: 1,
      id: 'added1',
      droppableId: preset.home.descriptor.id,
      type: preset.home.descriptor.type,
    },
  };
  const added2: DraggableDimension = {
    ...preset.inHome3,
    descriptor: {
      index: 2,
      id: 'added2',
      droppableId: preset.home.descriptor.id,
      type: preset.home.descriptor.type,
    },
  };
  const published: Published = {
    ...empty,
    additions: {
      draggables: [added1, added2],
      droppables: [],
    },
  };
  const original: CollectingState = state.collecting(
    preset.inHome3.descriptor.id,
  );

  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  // validation
  invariant(result.phase === 'DRAGGING');

  const draggables: DraggableDimensionMap = result.dimensions.draggables;

  // inHome1 has not changed as it was before the insertion
  expect(draggables[preset.inHome1.descriptor.id]).toEqual(preset.inHome1);

  // Everything else below it has been shifted
  const change: Position = patch(
    preset.home.axis.line,
    added1.client.marginBox.height + added2.client.marginBox.height,
  );

  const shiftDown = (draggable: DraggableDimension) =>
    shift({
      draggable,
      change,
      newIndex: draggable.descriptor.index + 2,
    });

  // inHome2 has shifted forward two places
  expect(draggables[preset.inHome2.descriptor.id]).toEqual(
    shiftDown(preset.inHome2),
  );

  // inHome3 has shifted down two places
  expect(draggables[preset.inHome3.descriptor.id]).toEqual(
    shiftDown(preset.inHome3),
  );

  // inHome4 has shifted down two places
  expect(draggables[preset.inHome4.descriptor.id]).toEqual(
    shiftDown(preset.inHome4),
  );

  // the added items have not been shifted
  expect(draggables[added1.descriptor.id]).toEqual(added1);
  expect(draggables[added2.descriptor.id]).toEqual(added2);
});

it('should shift draggables after a removed draggable', () => {
  const published: Published = {
    ...empty,
    removals: {
      draggables: [preset.inHome2.descriptor.id, preset.inHome3.descriptor.id],
      droppables: [],
    },
  };
  const original: CollectingState = state.collecting(
    preset.inHome4.descriptor.id,
  );

  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  // validation
  invariant(result.phase === 'DRAGGING');

  const draggables: DraggableDimensionMap = result.dimensions.draggables;

  // inHome1 has not changed as it was before the removal
  expect(draggables[preset.inHome1.descriptor.id]).toEqual(preset.inHome1);

  // Everything else below it has been shifted
  const change: Position = negate(
    patch(
      preset.home.axis.line,
      preset.inHome2.client.marginBox.height +
        preset.inHome3.client.marginBox.height,
    ),
  );

  const shiftUp = (draggable: DraggableDimension) =>
    shift({
      draggable,
      change,
      newIndex: draggable.descriptor.index - 2,
    });

  // inHome4 has shifted up two places
  expect(draggables[preset.inHome4.descriptor.id]).toEqual(
    shiftUp(preset.inHome4),
  );

  // inHome2 and inHome3 are gone
  expect(draggables).not.toHaveProperty(preset.inHome2.descriptor.id);
  expect(draggables).not.toHaveProperty(preset.inHome3.descriptor.id);
});

it('should shift draggables after multiple changes', () => {
  // dragging inHome3
  // inHome2 is removed
  // two items are inserted where inHome2 was
  const added1: DraggableDimension = {
    ...preset.inHome2,
    descriptor: {
      index: 1,
      id: 'added1',
      droppableId: preset.home.descriptor.id,
      type: preset.home.descriptor.type,
    },
  };
  const added2: DraggableDimension = {
    ...preset.inHome3,
    descriptor: {
      index: 2,
      id: 'added2',
      droppableId: preset.home.descriptor.id,
      type: preset.home.descriptor.type,
    },
  };
  const published: Published = {
    removals: {
      draggables: [preset.inHome2.descriptor.id],
      droppables: [],
    },
    additions: {
      draggables: [added1, added2],
      droppables: [],
    },
  };
  const original: CollectingState = state.collecting(
    preset.inHome3.descriptor.id,
  );

  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  // validation
  invariant(result.phase === 'DRAGGING');

  const draggables: DraggableDimensionMap = result.dimensions.draggables;

  // inHome1 has not changed as it was before the insertion
  expect(draggables[preset.inHome1.descriptor.id]).toEqual(preset.inHome1);

  // Everything else below it has been shifted
  const change: Position = patch(
    preset.home.axis.line,
    // two added items
    added1.client.marginBox.height +
      added2.client.marginBox.height -
      // one removed item
      preset.inHome2.client.marginBox.height,
  );

  const complexShift = (draggable: DraggableDimension) =>
    shift({
      draggable,
      change,
      // 2 inserted, 1 removed
      newIndex: draggable.descriptor.index + 1,
    });

  expect(draggables[preset.inHome3.descriptor.id]).toEqual(
    complexShift(preset.inHome3),
  );

  expect(draggables[preset.inHome4.descriptor.id]).toEqual(
    complexShift(preset.inHome4),
  );

  // the added items have not been shifted
  expect(draggables[added1.descriptor.id]).toEqual(added1);
  expect(draggables[added2.descriptor.id]).toEqual(added2);
  // inHome2 has been removed
  expect(draggables).not.toHaveProperty(preset.inHome2.descriptor.id);

  // Order validation: being totally over the top
  const getId = (draggable: DraggableDimension): DraggableId =>
    draggable.descriptor.id;
  const expected: DraggableId[] = [
    preset.inHome1,
    added1,
    added2,
    preset.inHome3,
    preset.inHome4,
  ].map(getId);
  const ordered: DraggableId[] = getDraggablesInsideDroppable(
    preset.home,
    draggables,
  ).map(getId);
  expect(ordered).toEqual(expected);
});
