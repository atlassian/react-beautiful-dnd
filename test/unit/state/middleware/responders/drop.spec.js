// @flow
import invariant from 'tiny-invariant';
import type {
  Responders,
  DropResult,
  CompletedDrag,
  State,
  DraggableLocation,
} from '../../../../../src/types';
import type { Store } from '../../../../../src/state/store-types';
import middleware from '../../../../../src/state/middleware/responders';
import createStore from '../util/create-store';
import {
  initialPublishArgs,
  getDragStart,
} from '../../../../util/preset-action-args';
import {
  initialPublish,
  completeDrop,
} from '../../../../../src/state/action-creators';
import getResponders from './util/get-responders-stub';
import getAnnounce from './util/get-announce-stub';
import getCompletedWithResult from './util/get-completed-with-result';
import getSimpleStatePreset from '../../../../util/get-simple-state-preset';
import { tryGetDestination } from '../../../../../src/state/get-impact-location';

const result: DropResult = {
  ...getDragStart(),
  destination: {
    droppableId: initialPublishArgs.critical.droppable.id,
    index: 2,
  },
  combine: null,
  reason: 'DROP',
};

jest.useFakeTimers();

it('should call the onDragEnd responder when a DROP_COMPLETE action occurs', () => {
  const responders: Responders = getResponders();
  const store: Store = createStore(middleware(() => responders, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));
  jest.runOnlyPendingTimers();
  expect(responders.onDragStart).toHaveBeenCalledTimes(1);

  store.dispatch(
    completeDrop({
      completed: getCompletedWithResult(result, store.getState()),
      shouldFlush: false,
    }),
  );
  expect(responders.onDragEnd).toHaveBeenCalledWith(result, expect.any(Object));
});

it('should throw an exception if there was no drag start published', () => {
  const responders: Responders = getResponders();
  const store: Store = createStore(middleware(() => responders, getAnnounce()));

  const borrowed: CompletedDrag = getSimpleStatePreset().dropAnimating()
    .completed;

  // throws when in idle
  expect(() =>
    store.dispatch(
      completeDrop({
        completed: borrowed,
        shouldFlush: false,
      }),
    ),
  ).toThrow('Can only flush responders while dragging');
});

it('should use the drop result and not the final impact', () => {
  const responders: Responders = getResponders();
  const store: Store = createStore(middleware(() => responders, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));
  jest.runOnlyPendingTimers();
  expect(responders.onDragStart).toHaveBeenCalledTimes(1);

  const state: State = store.getState();
  invariant(state.phase === 'DRAGGING');
  const destination: ?DraggableLocation = tryGetDestination(state.impact);
  invariant(destination);
  const fakeResult: DropResult = {
    ...getDragStart(),
    // ensuring the destination is different to the current impact to ensure
    // that the result is used for responders and not the last impact
    destination: {
      droppableId: destination.droppableId,
      index: destination.index + 1,
    },
    combine: null,
    reason: 'DROP',
  };

  store.dispatch(
    completeDrop({
      completed: getCompletedWithResult(fakeResult, store.getState()),
      shouldFlush: false,
    }),
  );
  expect(responders.onDragEnd).toHaveBeenCalledWith(
    fakeResult,
    expect.any(Object),
  );
});
