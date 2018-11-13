// @flow
import middleware from '../../../../../src/state/middleware/responders';
import createStore from '../util/create-store';
import type { Responders, DropResult } from '../../../../../src/types';
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
import getResponders from './util/get-responders-stub';
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
  const responders: Responders = getResponders();
  const store: Store = createStore(middleware(() => responders, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));
  expect(responders.onDragStart).not.toHaveBeenCalled();

  jest.runOnlyPendingTimers();
  expect(responders.onDragStart).toHaveBeenCalledTimes(1);
});

it('should queue a drag start if an action comes in while the timeout is pending', () => {
  const responders: Responders = getResponders();
  const store: Store = createStore(middleware(() => responders, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));
  expect(responders.onDragStart).not.toHaveBeenCalled();

  store.dispatch(moveDown());
  expect(responders.onDragStart).not.toHaveBeenCalled();

  jest.runOnlyPendingTimers();

  expect(responders.onDragStart).toHaveBeenCalledTimes(1);
  expect(responders.onDragUpdate).toHaveBeenCalledTimes(1);
});

it('should flush any pending responders if a drop occurs', () => {
  const responders: Responders = getResponders();
  const store: Store = createStore(middleware(() => responders, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));
  expect(responders.onDragStart).not.toHaveBeenCalled();
  expect(responders.onDragUpdate).not.toHaveBeenCalled();

  store.dispatch(moveDown());
  expect(responders.onDragStart).not.toHaveBeenCalled();
  expect(responders.onDragUpdate).not.toHaveBeenCalled();

  store.dispatch(moveUp());
  expect(responders.onDragStart).not.toHaveBeenCalled();
  expect(responders.onDragUpdate).not.toHaveBeenCalled();

  store.dispatch(completeDrop(result));
  expect(responders.onDragStart).toHaveBeenCalledTimes(1);
  expect(responders.onDragUpdate).toHaveBeenCalledTimes(2);
  expect(responders.onDragEnd).toHaveBeenCalledWith(result, expect.any(Object));
});

it('should work across multiple drags', () => {
  const responders: Responders = getResponders();
  const store: Store = createStore(middleware(() => responders, getAnnounce()));
  Array.from({ length: 4 }).forEach(() => {
    store.dispatch(initialPublish(initialPublishArgs));
    expect(responders.onBeforeDragStart).toHaveBeenCalled();
    expect(responders.onDragStart).not.toHaveBeenCalled();

    store.dispatch(moveDown());
    expect(responders.onDragStart).not.toHaveBeenCalled();
    expect(responders.onDragUpdate).not.toHaveBeenCalled();

    store.dispatch(completeDrop(result));
    expect(responders.onDragStart).toHaveBeenCalledTimes(1);
    expect(responders.onDragUpdate).toHaveBeenCalledTimes(1);
    expect(responders.onDragEnd).toHaveBeenCalledWith(
      result,
      expect.any(Object),
    );

    // $FlowFixMe - responder does not have mockReset property
    responders.onDragStart.mockReset();
    // $FlowFixMe - responder does not have mockReset property
    responders.onDragUpdate.mockReset();
    responders.onDragEnd.mockReset();
  });
});
