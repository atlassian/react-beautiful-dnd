// @flow
import invariant from 'tiny-invariant';
import {
  initialPublish,
  move,
  moveDown,
  type MoveArgs,
} from '../../../../../src/state/action-creators';
import middleware from '../../../../../src/state/middleware/handles';
import { add } from '../../../../../src/state/position';
import {
  getDragStart,
  initialPublishArgs,
} from '../../../../utils/preset-action-args';
import createStore from '../util/create-store';
import getAnnounce from './util/get-announce-stub';
import createHandles from './util/get-handles-stub';
import type { Handles, State, DragUpdate } from '../../../../../src/types';
import type { Store, Dispatch } from '../../../../../src/state/store-types';

jest.useFakeTimers();

const start = (dispatch: Dispatch) => {
  dispatch(initialPublish(initialPublishArgs));
  jest.runOnlyPendingTimers();
};

it('should call onDragUpdate if the position has changed on move', () => {
  const handles: Handles = createHandles();
  const store: Store = createStore(middleware(() => handles, getAnnounce()));

  start(store.dispatch);
  expect(handles.onDragStart).toHaveBeenCalledTimes(1);
  expect(handles.onDragUpdate).not.toHaveBeenCalled();

  // Okay let's move it
  store.dispatch(moveDown());
  // not called until next cycle
  expect(handles.onDragUpdate).not.toHaveBeenCalled();

  jest.runOnlyPendingTimers();
  const update: DragUpdate = {
    ...getDragStart(),
    combine: null,
    destination: {
      droppableId: initialPublishArgs.critical.droppable.id,
      index: initialPublishArgs.critical.draggable.index + 1,
    },
  };
  expect(handles.onDragUpdate).toHaveBeenCalledWith(update, expect.any(Object));
});

it('should not call onDragUpdate if there is no movement from the last update', () => {
  const handles: Handles = createHandles();
  const store: Store = createStore(middleware(() => handles, getAnnounce()));

  start(store.dispatch);
  expect(handles.onDragStart).toHaveBeenCalledTimes(1);

  // onDragUpdate not called yet
  jest.runOnlyPendingTimers();
  expect(handles.onDragUpdate).not.toHaveBeenCalled();

  // A movement to the same index is not causing an update
  const moveArgs: MoveArgs = {
    // tiny change
    client: add(initialPublishArgs.clientSelection, { x: 1, y: 1 }),
  };
  store.dispatch(move(moveArgs));

  // update not called after flushing
  jest.runOnlyPendingTimers();
  expect(handles.onDragUpdate).not.toHaveBeenCalled();

  // Triggering an actual movement
  store.dispatch(moveDown());
  jest.runOnlyPendingTimers();
  expect(handles.onDragUpdate).toHaveBeenCalledTimes(1);

  const state: State = store.getState();
  invariant(
    state.phase === 'DRAGGING',
    'Expecting state to be in dragging phase',
  );

  // A small movement that should not trigger any index changes
  store.dispatch(
    move({
      client: add(state.current.client.selection, { x: -1, y: -1 }),
    }),
  );

  jest.runOnlyPendingTimers();
  expect(handles.onDragUpdate).toHaveBeenCalledTimes(1);
});
