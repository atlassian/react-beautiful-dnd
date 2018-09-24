// @flow
import invariant from 'tiny-invariant';
import {
  collectionStarting,
  initialPublish,
  InitialPublishArgs,
  moveDown,
  moveUp,
  publish,
} from '../../../../../src/state/action-creators';
import middleware from '../../../../../src/state/middleware/hooks';
import { getPreset, makeScrollable } from '../../../../utils/dimension';
import {
  initialPublishWithScrollables,
  publishAdditionArgs,
} from '../../../../utils/preset-action-args';
import createStore from '../util/create-store';
import getAnnounce from './util/get-announce-stub';
import createHooks from './util/get-hooks-stub';
import type {
  Hooks,
  State,
  DragUpdate,
  Published,
  DragStart,
  DroppableDimension,
} from '../../../../../src/types';
import type { Store } from '../../../../../src/state/store-types';

const preset = getPreset();

it('should not call onDragUpdate if the destination or source have not changed', () => {
  const hooks: Hooks = createHooks();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));

  store.dispatch(initialPublish(initialPublishWithScrollables));
  requestAnimationFrame.step();
  expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
  expect(hooks.onDragUpdate).not.toHaveBeenCalled();

  store.dispatch(collectionStarting());
  store.dispatch(publish(publishAdditionArgs));
  // // not called yet as position has not changed
  expect(hooks.onDragUpdate).not.toHaveBeenCalled();
});

it('should call onDragUpdate if the source has changed - even if the destination has not changed', () => {
  // - dragging inHome2 with no impact
  // - inHome1 is removed
  const hooks: Hooks = createHooks();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));
  // dragging inHome2 with no impact
  const scrollableHome: DroppableDimension = makeScrollable(preset.home);
  const customInitial: InitialPublishArgs = {
    critical: {
      draggable: preset.inHome2.descriptor,
      droppable: preset.home.descriptor,
    },
    dimensions: {
      ...preset.dimensions,
      droppables: {
        ...preset.dimensions.droppables,
        // needs to be scrollable to allow dynamic changes
        [preset.home.descriptor.id]: scrollableHome,
      },
    },
    client: {
      selection: preset.inHome2.client.borderBox.center,
      borderBoxCenter: preset.inHome2.client.borderBox.center,
      offset: { x: 0, y: 0 },
    },
    viewport: preset.viewport,
    movementMode: 'FLUID',
  };

  store.dispatch(initialPublish(customInitial));
  requestAnimationFrame.step();
  const start: DragStart = {
    draggableId: preset.inHome2.descriptor.id,
    type: preset.home.descriptor.type,
    source: {
      droppableId: preset.home.descriptor.id,
      index: 1,
    },
  };
  expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
  expect(hooks.onDragStart).toHaveBeenCalledWith(start, expect.any(Object));
  expect(hooks.onDragUpdate).not.toHaveBeenCalled();

  // first move down
  store.dispatch(moveDown());
  expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);
  // $ExpectError - unknown mock reset property
  hooks.onDragUpdate.mockReset();

  // move up into the original position
  store.dispatch(moveUp());
  // no current displacement
  {
    const current: State = store.getState();
    invariant(current.impact);
    expect(current.impact.movement.displaced).toEqual([]);
  }
  const lastUpdate: DragUpdate = {
    draggableId: preset.inHome2.descriptor.id,
    type: preset.home.descriptor.type,
    source: {
      droppableId: preset.home.descriptor.id,
      index: 1,
    },
    // back in the home location
    destination: {
      droppableId: preset.home.descriptor.id,
      index: 1,
    },
    combine: null,
  };
  expect(hooks.onDragUpdate).toHaveBeenCalledWith(
    lastUpdate,
    expect.any(Object),
  );
  expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);
  // $ExpectError - unknown mock reset property
  hooks.onDragUpdate.mockReset();

  // removing inHome1
  const customPublish: Published = {
    additions: [],
    removals: [preset.inHome1.descriptor.id],
    modified: [scrollableHome],
  };

  store.dispatch(collectionStarting());
  store.dispatch(publish(customPublish));

  const postPublishUpdate: DragUpdate = {
    draggableId: preset.inHome2.descriptor.id,
    type: preset.home.descriptor.type,
    // new source as inHome1 was removed
    source: {
      droppableId: preset.home.descriptor.id,
      index: 0,
    },
    // destination has not changed from last update
    destination: lastUpdate.destination,
    combine: null,
  };
  expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);
  expect(hooks.onDragUpdate).toHaveBeenCalledWith(
    postPublishUpdate,
    expect.any(Object),
  );
});
