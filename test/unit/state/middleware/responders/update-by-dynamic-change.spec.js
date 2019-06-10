// @flow
import invariant from 'tiny-invariant';
import {
  collectionStarting,
  initialPublish,
  moveDown,
  moveUp,
  publishWhileDragging,
  type InitialPublishArgs,
} from '../../../../../src/state/action-creators';
import middleware from '../../../../../src/state/middleware/responders';
import { getPreset, makeScrollable } from '../../../../utils/dimension';
import {
  initialPublishWithScrollables,
  publishAdditionArgs,
} from '../../../../utils/preset-action-args';
import createStore from '../util/create-store';
import getAnnounce from './util/get-announce-stub';
import createResponders from './util/get-responders-stub';
import type {
  Responders,
  State,
  DragUpdate,
  Published,
  DragStart,
  DroppableDimension,
} from '../../../../../src/types';
import type { Store } from '../../../../../src/state/store-types';
import getNotAnimatedDisplacement from '../../../../utils/get-displacement/get-not-animated-displacement';
import getVisibleDisplacement from '../../../../utils/get-displacement/get-visible-displacement';

jest.useFakeTimers();
const preset = getPreset();

it('should not call onDragUpdate if the destination or source have not changed', () => {
  const responders: Responders = createResponders();
  const store: Store = createStore(middleware(() => responders, getAnnounce()));

  store.dispatch(initialPublish(initialPublishWithScrollables));
  jest.runOnlyPendingTimers();
  expect(responders.onDragStart).toHaveBeenCalledTimes(1);
  expect(responders.onDragUpdate).not.toHaveBeenCalled();

  store.dispatch(collectionStarting());
  store.dispatch(publishWhileDragging(publishAdditionArgs));
  // checking there are no queued responders
  jest.runAllTimers();
  // not called yet as position has not changed
  expect(responders.onDragUpdate).not.toHaveBeenCalled();
});

it('should call onDragUpdate if the source has changed - even if the destination has not changed', () => {
  // - dragging inHome2
  // - inHome1 is removed
  const responders: Responders = createResponders();
  const store: Store = createStore(middleware(() => responders, getAnnounce()));
  // dragging inHome2
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
    clientSelection: preset.inHome2.client.borderBox.center,
    viewport: preset.viewport,
    movementMode: 'FLUID',
  };

  store.dispatch(initialPublish(customInitial));
  jest.runOnlyPendingTimers();
  const start: DragStart = {
    draggableId: preset.inHome2.descriptor.id,
    type: preset.inHome2.descriptor.type,
    source: {
      droppableId: preset.home.descriptor.id,
      index: 1,
    },
    mode: 'FLUID',
  };
  expect(responders.onDragStart).toHaveBeenCalledTimes(1);
  expect(responders.onDragStart).toHaveBeenCalledWith(
    start,
    expect.any(Object),
  );
  jest.runOnlyPendingTimers();
  expect(responders.onDragUpdate).not.toHaveBeenCalled();

  // first move down (and release responder)
  store.dispatch(moveDown());
  jest.runOnlyPendingTimers();
  expect(responders.onDragUpdate).toHaveBeenCalledTimes(1);
  // $ExpectError - unknown mock reset property
  responders.onDragUpdate.mockReset();

  // move up into the original position (and release cycle)
  store.dispatch(moveUp());
  jest.runOnlyPendingTimers();
  // validating current displacement
  {
    const current: State = store.getState();
    invariant(current.impact);
    expect(current.impact.movement.displaced).toEqual([
      // displacement removed and then readded
      getVisibleDisplacement(preset.inHome3),
      // original not animated displacement
      getNotAnimatedDisplacement(preset.inHome4),
    ]);
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
    mode: 'FLUID',
  };
  expect(responders.onDragUpdate).toHaveBeenCalledWith(
    lastUpdate,
    expect.any(Object),
  );
  expect(responders.onDragUpdate).toHaveBeenCalledTimes(1);
  // $ExpectError - unknown mock reset property
  responders.onDragUpdate.mockReset();

  // removing inHome1
  const customPublish: Published = {
    additions: [],
    removals: [preset.inHome1.descriptor.id],
    modified: [scrollableHome],
  };

  store.dispatch(collectionStarting());
  store.dispatch(publishWhileDragging(customPublish));
  // releasing update frame
  jest.runOnlyPendingTimers();

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
    mode: 'FLUID',
  };
  expect(responders.onDragUpdate).toHaveBeenCalledTimes(1);
  expect(responders.onDragUpdate).toHaveBeenCalledWith(
    postPublishUpdate,
    expect.any(Object),
  );
});
