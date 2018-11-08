// @flow
import {
  clean,
  completeDrop,
  initialPublish,
  moveDown,
} from '../../../../../src/state/action-creators';
import middleware from '../../../../../src/state/middleware/handles';
import {
  getDragStart,
  initialPublishArgs,
} from '../../../../utils/preset-action-args';
import createStore from '../util/create-store';
import type { Handles, DragUpdate, DropResult } from '../../../../../src/types';
import createHandles from './util/get-handles-stub';
import getAnnounce from './util/get-announce-stub';

jest.useFakeTimers();

it('should behave correctly across multiple drags', () => {
  const handles: Handles = createHandles();
  const store = createStore(middleware(() => handles, getAnnounce()));
  Array.from({ length: 4 }).forEach(() => {
    // start
    store.dispatch(initialPublish(initialPublishArgs));
    jest.runOnlyPendingTimers();
    expect(handles.onDragStart).toHaveBeenCalledWith(
      getDragStart(),
      expect.any(Object),
    );
    expect(handles.onDragStart).toHaveBeenCalledTimes(1);

    // update
    const update: DragUpdate = {
      ...getDragStart(),
      destination: {
        droppableId: initialPublishArgs.critical.droppable.id,
        index: initialPublishArgs.critical.draggable.index + 1,
      },
      combine: null,
    };
    store.dispatch(moveDown());
    // flush handle call
    jest.runOnlyPendingTimers();
    expect(handles.onDragUpdate).toHaveBeenCalledWith(
      update,
      expect.any(Object),
    );
    expect(handles.onDragUpdate).toHaveBeenCalledTimes(1);

    // drop
    const result: DropResult = {
      ...update,
      reason: 'DROP',
    };
    store.dispatch(completeDrop(result));
    expect(handles.onDragEnd).toHaveBeenCalledWith(result, expect.any(Object));
    expect(handles.onDragEnd).toHaveBeenCalledTimes(1);

    // cleanup
    store.dispatch(clean());
    // $ExpectError - unknown mock reset property
    handles.onDragStart.mockReset();
    // $ExpectError - unknown mock reset property
    handles.onDragUpdate.mockReset();
    // $ExpectError - unknown mock reset property
    handles.onDragEnd.mockReset();
  });
});
