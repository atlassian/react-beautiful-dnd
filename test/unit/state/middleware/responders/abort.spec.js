// @flow
import invariant from 'tiny-invariant';
import type {
  DraggableLocation,
  Responders,
  State,
  DropResult,
} from '../../../../../src/types';
import type { Store } from '../../../../../src/state/store-types';
import {
  clean,
  completeDrop,
  initialPublish,
} from '../../../../../src/state/action-creators';
import middleware from '../../../../../src/state/middleware/responders';
import {
  getDragStart,
  initialPublishArgs,
} from '../../../../utils/preset-action-args';
import createStore from '../util/create-store';
import getAnnounce from './util/get-announce-stub';
import createResponders from './util/get-responders-stub';
import getCompletedWithResult from './util/get-completed-with-result';
import { tryGetDestination } from '../../../../../src/state/get-impact-location';

jest.useFakeTimers();

it('should call onDragEnd with the last published critical descriptor', () => {
  const responders: Responders = createResponders();
  const store: Store = createStore(middleware(() => responders, getAnnounce()));

  store.dispatch(clean());
  store.dispatch(initialPublish(initialPublishArgs));
  jest.runOnlyPendingTimers();
  expect(responders.onDragStart).toHaveBeenCalledTimes(1);

  store.dispatch(clean());
  const expected: DropResult = {
    ...getDragStart(),
    destination: null,
    combine: null,
    reason: 'CANCEL',
  };
  expect(responders.onDragEnd).toHaveBeenCalledWith(
    expected,
    expect.any(Object),
  );
});

it('should publish an onDragEnd with no destination even if there is a current destination', () => {
  const responders: Responders = createResponders();
  const store: Store = createStore(middleware(() => responders, getAnnounce()));

  store.dispatch(clean());
  store.dispatch(initialPublish(initialPublishArgs));
  jest.runOnlyPendingTimers();

  const state: State = store.getState();
  invariant(state.phase === 'DRAGGING');
  // in home location
  const home: DraggableLocation = {
    droppableId: initialPublishArgs.critical.droppable.id,
    index: initialPublishArgs.critical.draggable.index,
  };
  expect(tryGetDestination(state.impact)).toEqual(home);

  store.dispatch(clean());
  const expected: DropResult = {
    ...getDragStart(),
    // destination has been cleared
    destination: null,
    combine: null,
    reason: 'CANCEL',
  };
  expect(responders.onDragEnd).toHaveBeenCalledWith(
    expected,
    expect.any(Object),
  );
});

it('should not publish an onDragEnd if aborted after a drop', () => {
  const responders: Responders = createResponders();
  const store: Store = createStore(middleware(() => responders, getAnnounce()));

  // lift
  store.dispatch(clean());
  store.dispatch(initialPublish(initialPublishArgs));
  jest.runOnlyPendingTimers();
  expect(responders.onDragStart).toHaveBeenCalled();

  // drop
  const result: DropResult = {
    ...getDragStart(),
    destination: null,
    combine: null,
    reason: 'CANCEL',
  };
  store.dispatch(
    completeDrop({
      completed: getCompletedWithResult(result, store.getState()),
      shouldFlush: false,
    }),
  );
  expect(responders.onDragEnd).toHaveBeenCalledTimes(1);
  // $ExpectError - mock
  responders.onDragEnd.mockReset();

  // abort
  store.dispatch(clean());
  expect(responders.onDragEnd).not.toHaveBeenCalled();
});

it('should publish an on drag end if aborted before the publish of an onDragStart', () => {
  const responders: Responders = createResponders();
  const store: Store = createStore(middleware(() => responders, getAnnounce()));

  // lift
  store.dispatch(clean());
  store.dispatch(initialPublish(initialPublishArgs));
  // onDragStart not flushed yet
  expect(responders.onDragStart).not.toHaveBeenCalled();

  // drop
  const result: DropResult = {
    ...getDragStart(),
    destination: null,
    combine: null,
    reason: 'CANCEL',
  };
  store.dispatch(
    completeDrop({
      completed: getCompletedWithResult(result, store.getState()),
      shouldFlush: false,
    }),
  );
  expect(responders.onDragEnd).toHaveBeenCalledTimes(1);

  // validation - onDragStart has been flushed
  expect(responders.onDragStart).toHaveBeenCalledTimes(1);
});
