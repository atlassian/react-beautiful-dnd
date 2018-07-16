// @flow
import type { Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import publish from '../../../../src/state/publish';
import { getPreset } from '../../../utils/dimension';
import getStatePreset from '../../../utils/get-simple-state-preset';
import { empty, shift } from './util';
import { patch, add, origin, negate } from '../../../../src/state/position';
import type {
  Published,
  DraggableDimension,
  DropPendingState,
  DraggingState,
  ClientPositions,
  PagePositions,
  DragPositions,
  CollectingState,
} from '../../../../src/types';

const state = getStatePreset();
const preset = getPreset();

it('should not adjust the drag positions if nothing was changed', () => {
  const original: CollectingState = state.collecting();

  const result: DraggingState | DropPendingState = publish({
    state: original,
    published: empty,
  });

  invariant(result.phase === 'DRAGGING');
  expect(result.current).toEqual(original.current);
  expect(result.initial).toEqual(original.initial);
});

it('should not adjust the drag positions if an item was added after the critical', () => {
  const added: DraggableDimension = {
    ...preset.inHome3,
    descriptor: {
      index: preset.inHome3.descriptor.index,
      id: 'added',
      droppableId: preset.home.descriptor.id,
      type: preset.home.descriptor.type,
    },
  };
  const published: Published = {
    ...empty,
    additions: {
      draggables: [added],
      droppables: [],
    },
  };

  const original: CollectingState = state.collecting(
    preset.inHome2.descriptor.id,
  );

  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  invariant(result.phase === 'DRAGGING');
  expect(result.current).toEqual(original.current);
  expect(result.initial).toEqual(original.initial);
});

type AdjustResult = {|
  current: DragPositions,
  initial: DragPositions,
|};

const adjust = (original: CollectingState, change: Position): AdjustResult => {
  const initial: DragPositions = (() => {
    const client: ClientPositions = {
      selection: add(original.initial.client.selection, change),
      borderBoxCenter: add(original.initial.client.borderBoxCenter, change),
      offset: origin,
    };
    const page: PagePositions = {
      selection: add(client.selection, original.viewport.scroll.initial),
      borderBoxCenter: add(
        client.borderBoxCenter,
        original.viewport.scroll.initial,
      ),
    };

    return { page, client };
  })();

  // need to undo the shift to maintain the existing visual position
  const reverse: Position = negate(change);
  const offset: Position = add(original.current.client.offset, reverse);
  const current: DragPositions = (() => {
    const client: ClientPositions = {
      selection: add(initial.client.selection, offset),
      borderBoxCenter: add(initial.client.borderBoxCenter, offset),
      offset,
    };
    const page: PagePositions = {
      selection: add(client.selection, original.viewport.scroll.current),
      borderBoxCenter: add(
        client.borderBoxCenter,
        original.viewport.scroll.current,
      ),
    };

    return { page, client };
  })();

  return { initial, current };
};

it('should not adjust the drag positions if an item was removed after the critical', () => {
  const published: Published = {
    ...empty,
    removals: {
      draggables: [preset.inHome3.descriptor.id],
      droppables: [],
    },
  };

  const original: CollectingState = state.collecting(
    preset.inHome2.descriptor.id,
  );

  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  invariant(result.phase === 'DRAGGING');
  expect(result.current).toEqual(original.current);
  expect(result.initial).toEqual(original.initial);
});

it('should account for additions before the critical', () => {
  // inserting two items before the critical
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
  const original: CollectingState = state.collecting(
    preset.inHome2.descriptor.id,
  );
  const published: Published = {
    ...empty,
    additions: {
      draggables: [added1, added2],
      droppables: [],
    },
  };

  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  invariant(result.phase === 'DRAGGING');

  // inHome2 would have shifted two positions
  const change: Position = patch(
    preset.home.axis.line,
    added1.client.marginBox.height + added2.client.marginBox.height,
  );

  const { initial, current } = adjust(original, change);

  expect(result.initial).toEqual(initial);
  expect(result.current).toEqual(current);

  // validation
  const shifted: DraggableDimension = shift({
    draggable: preset.inHome2,
    change,
    newIndex: preset.inHome2.descriptor.index + 2,
  });
  expect(result.critical.draggable).toEqual(shifted.descriptor);
  expect(result.dimensions.draggables[preset.inHome2.descriptor.id]).toEqual(
    shifted,
  );
});

it('should account for removals before the critical', () => {
  const original: CollectingState = state.collecting(
    preset.inHome3.descriptor.id,
  );
  const published: Published = {
    ...empty,
    removals: {
      draggables: [preset.inHome1.descriptor.id, preset.inHome2.descriptor.id],
      droppables: [],
    },
  };

  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  invariant(result.phase === 'DRAGGING');

  // inHome2 would have shifted two positions
  const change: Position = negate(
    patch(
      preset.home.axis.line,
      preset.inHome1.client.marginBox.height +
        preset.inHome2.client.marginBox.height,
    ),
  );

  const { initial, current } = adjust(original, change);

  expect(result.initial).toEqual(initial);
  expect(result.current).toEqual(current);

  // validation
  const shifted: DraggableDimension = shift({
    draggable: preset.inHome3,
    change,
    newIndex: preset.inHome3.descriptor.index - 2,
  });
  expect(result.critical.draggable).toEqual(shifted.descriptor);
  expect(result.dimensions.draggables[preset.inHome3.descriptor.id]).toEqual(
    shifted,
  );
});

it('should account for changes that result in no net movement before the critical', () => {
  // adding 1, removing inHome1
  const added1: DraggableDimension = {
    ...preset.inHome1,
    descriptor: {
      index: 0,
      id: 'added1',
      droppableId: preset.home.descriptor.id,
      type: preset.home.descriptor.type,
    },
  };
  const original: CollectingState = state.collecting(
    preset.inHome2.descriptor.id,
  );
  const published: Published = {
    removals: {
      draggables: [preset.inHome1.descriptor.id],
      droppables: [],
    },
    additions: {
      draggables: [added1],
      droppables: [],
    },
  };

  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  invariant(result.phase === 'DRAGGING');

  // inHome2 would have shifted two positions
  const change: Position = patch(
    preset.home.axis.line,
    added1.client.marginBox.height - preset.inHome1.client.marginBox.height,
  );

  const { initial, current } = adjust(original, change);

  expect(result.initial).toEqual(initial);
  expect(result.current).toEqual(current);

  // validation
  const shifted: DraggableDimension = shift({
    draggable: preset.inHome2,
    change,
    // add one before, remove one before
    newIndex: preset.inHome2.descriptor.index,
  });
  expect(result.critical.draggable).toEqual(shifted.descriptor);
  expect(result.dimensions.draggables[preset.inHome2.descriptor.id]).toEqual(
    shifted,
  );
});
