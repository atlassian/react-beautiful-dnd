// @flow
import middleware from '../../../../../src/state/middleware/handles';
import createStore from '../util/create-store';
import type { Handles, DropResult } from '../../../../../src/types';
import {
  initialPublishArgs,
  getDragStart,
} from '../../../../utils/preset-action-args';
import {
  initialPublish,
  completeDrop,
  moveDown,
  moveUp,
} from '../../../../../src/state/action-creators';
import type { Store } from '../../../../../src/state/store-types';
import getHandles from './util/get-handles-stub';
import getAnnounce from './util/get-announce-stub';

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

it('should trigger an on drag start after in the next cycle', () => {
  const handles: Handles = getHandles();
  const store: Store = createStore(middleware(() => handles, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));
  expect(handles.onDragStart).not.toHaveBeenCalled();

  jest.runOnlyPendingTimers();
  expect(handles.onDragStart).toHaveBeenCalledTimes(1);
});

it('should queue a drag start if an action comes in while the timeout is pending', () => {
  const handles: Handles = getHandles();
  const store: Store = createStore(middleware(() => handles, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));
  expect(handles.onDragStart).not.toHaveBeenCalled();

  store.dispatch(moveDown());
  expect(handles.onDragStart).not.toHaveBeenCalled();

  jest.runOnlyPendingTimers();

  expect(handles.onDragStart).toHaveBeenCalledTimes(1);
  expect(handles.onDragUpdate).toHaveBeenCalledTimes(1);
});

it('should flush any pending handles if a drop occurs', () => {
  const handles: Handles = getHandles();
  const store: Store = createStore(middleware(() => handles, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));
  expect(handles.onDragStart).not.toHaveBeenCalled();
  expect(handles.onDragUpdate).not.toHaveBeenCalled();

  store.dispatch(moveDown());
  expect(handles.onDragStart).not.toHaveBeenCalled();
  expect(handles.onDragUpdate).not.toHaveBeenCalled();

  store.dispatch(moveUp());
  expect(handles.onDragStart).not.toHaveBeenCalled();
  expect(handles.onDragUpdate).not.toHaveBeenCalled();

  store.dispatch(completeDrop(result));
  expect(handles.onDragStart).toHaveBeenCalledTimes(1);
  expect(handles.onDragUpdate).toHaveBeenCalledTimes(2);
  expect(handles.onDragEnd).toHaveBeenCalledWith(result, expect.any(Object));
});

it('should work across multiple drags', () => {
  const handles: Handles = getHandles();
  const store: Store = createStore(middleware(() => handles, getAnnounce()));
  Array.from({ length: 4 }).forEach(() => {
    store.dispatch(initialPublish(initialPublishArgs));
    expect(handles.onBeforeDragStart).toHaveBeenCalled();
    expect(handles.onDragStart).not.toHaveBeenCalled();

    store.dispatch(moveDown());
    expect(handles.onDragStart).not.toHaveBeenCalled();
    expect(handles.onDragUpdate).not.toHaveBeenCalled();

    store.dispatch(completeDrop(result));
    expect(handles.onDragStart).toHaveBeenCalledTimes(1);
    expect(handles.onDragUpdate).toHaveBeenCalledTimes(1);
    expect(handles.onDragEnd).toHaveBeenCalledWith(result, expect.any(Object));

    // $FlowFixMe - handle does not have mockReset property
    handles.onDragStart.mockReset();
    // $FlowFixMe - handle does not have mockReset property
    handles.onDragUpdate.mockReset();
    // $FlowFixMe - handle does not have mockReset property
    handles.onDragEnd.mockReset();
  });
});
