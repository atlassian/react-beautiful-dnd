// @flow
import invariant from 'tiny-invariant';
import {
  clean,
  completeDrop,
  initialPublish,
} from '../../../../../src/state/action-creators';
import middleware from '../../../../../src/state/middleware/handles';
import {
  getDragStart,
  initialPublishArgs,
} from '../../../../utils/preset-action-args';
import createStore from '../util/create-store';
import getAnnounce from './util/get-announce-stub';
import createHandles from './util/get-handles-stub';
import type {
  DraggableLocation,
  Handles,
  State,
  DropResult,
} from '../../../../../src/types';
import type { Store } from '../../../../../src/state/store-types';

jest.useFakeTimers();

it('should call onDragEnd with the last published critical descriptor', () => {
  const handles: Handles = createHandles();
  const store: Store = createStore(middleware(() => handles, getAnnounce()));

  store.dispatch(clean());
  store.dispatch(initialPublish(initialPublishArgs));
  jest.runOnlyPendingTimers();
  expect(handles.onDragStart).toHaveBeenCalledTimes(1);

  store.dispatch(clean());
  const expected: DropResult = {
    ...getDragStart(),
    destination: null,
    combine: null,
    reason: 'CANCEL',
  };
  expect(handles.onDragEnd).toHaveBeenCalledWith(expected, expect.any(Object));
});

it('should publish an onDragEnd with no destination even if there is a current destination', () => {
  const handles: Handles = createHandles();
  const store: Store = createStore(middleware(() => handles, getAnnounce()));

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
  expect(state.impact.destination).toEqual(home);

  store.dispatch(clean());
  const expected: DropResult = {
    ...getDragStart(),
    // destination has been cleared
    destination: null,
    combine: null,
    reason: 'CANCEL',
  };
  expect(handles.onDragEnd).toHaveBeenCalledWith(expected, expect.any(Object));
});

it('should not publish an onDragEnd if aborted after a drop', () => {
  const handles: Handles = createHandles();
  const store: Store = createStore(middleware(() => handles, getAnnounce()));

  // lift
  store.dispatch(clean());
  store.dispatch(initialPublish(initialPublishArgs));
  jest.runOnlyPendingTimers();
  expect(handles.onDragStart).toHaveBeenCalled();

  // drop
  const result: DropResult = {
    ...getDragStart(),
    destination: null,
    combine: null,
    reason: 'CANCEL',
  };
  store.dispatch(completeDrop(result));
  expect(handles.onDragEnd).toHaveBeenCalledTimes(1);
  // $ExpectError - unknown mock reset property
  handles.onDragEnd.mockReset();

  // abort
  store.dispatch(clean());
  expect(handles.onDragEnd).not.toHaveBeenCalled();
});

it('should publish an on drag end if aborted before the publish of an onDragStart', () => {
  const handles: Handles = createHandles();
  const store: Store = createStore(middleware(() => handles, getAnnounce()));

  // lift
  store.dispatch(clean());
  store.dispatch(initialPublish(initialPublishArgs));
  // onDragStart not flushed yet
  expect(handles.onDragStart).not.toHaveBeenCalled();

  // drop
  const result: DropResult = {
    ...getDragStart(),
    destination: null,
    combine: null,
    reason: 'CANCEL',
  };
  store.dispatch(completeDrop(result));
  expect(handles.onDragEnd).toHaveBeenCalledTimes(1);

  // validation - onDragStart has been flushed
  expect(handles.onDragStart).toHaveBeenCalledTimes(1);
});
