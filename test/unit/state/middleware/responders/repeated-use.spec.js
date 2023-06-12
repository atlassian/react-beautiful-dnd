// @flow
import {
  flush,
  completeDrop,
  initialPublish,
  moveDown,
} from '../../../../../src/state/action-creators';
import middleware from '../../../../../src/state/middleware/responders';
import {
  getDragStart,
  initialPublishArgs,
} from '../../../../util/preset-action-args';
import createStore from '../util/create-store';
import type {
  Responders,
  DragUpdate,
  DropResult,
  DraggingState,
} from '../../../../../src/types';
import createResponders from './util/get-responders-stub';
import getAnnounce from './util/get-announce-stub';
import getCompletedWithResult from './util/get-completed-with-result';

jest.useFakeTimers();

it('should behave correctly across multiple drags', () => {
  const responders: Responders = createResponders();
  const store = createStore(middleware(() => responders, getAnnounce()));
  Array.from({ length: 4 }).forEach(() => {
    // start
    store.dispatch(initialPublish(initialPublishArgs));
    jest.runOnlyPendingTimers();
    expect(responders.onDragStart).toHaveBeenCalledWith(
      getDragStart(),
      expect.any(Object),
    );
    expect(responders.onDragStart).toHaveBeenCalledTimes(1);

    // update
    const newIndex = initialPublishArgs.critical.draggable.index + 1;
    const state: DraggingState = store.getState();
    const newDraggableId = Object.keys(state.dimensions.draggables)[newIndex];
    const update: DragUpdate = {
      ...getDragStart(),
      destination: {
        droppableId: initialPublishArgs.critical.droppable.id,
        index: newIndex,
        draggableId: newDraggableId,
      },
      combine: null,
    };
    store.dispatch(moveDown());
    // flush responder call
    jest.runOnlyPendingTimers();
    expect(responders.onDragUpdate).toHaveBeenCalledWith(
      update,
      expect.any(Object),
    );
    expect(responders.onDragUpdate).toHaveBeenCalledTimes(1);

    // drop
    const result: DropResult = {
      ...update,
      reason: 'DROP',
    };
    store.dispatch(
      completeDrop({
        completed: getCompletedWithResult(result, store.getState()),
      }),
    );
    expect(responders.onDragEnd).toHaveBeenCalledWith(
      result,
      expect.any(Object),
    );
    expect(responders.onDragEnd).toHaveBeenCalledTimes(1);

    // cleanup
    store.dispatch(flush());
    // $ExpectError - unknown mock reset property
    responders.onDragStart.mockReset();
    // $ExpectError - unknown mock reset property
    responders.onDragUpdate.mockReset();
    // $ExpectError - unknown mock reset property
    responders.onDragEnd.mockReset();
  });
});
