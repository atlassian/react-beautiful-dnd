// @flow
import {
  clean,
  completeDrop,
  initialPublish,
  moveDown,
} from '../../../../../src/state/action-creators';
import middleware from '../../../../../src/state/middleware/hooks';
import {
  getDragStart,
  initialPublishArgs,
} from '../../../../utils/preset-action-args';
import createStore from '../util/create-store';
import type { Hooks, DragUpdate, DropResult } from '../../../../../src/types';
import createHooks from './util/get-hooks-stub';
import getAnnounce from './util/get-announce-stub';

it('should behave correctly across multiple drags', () => {
  const hooks: Hooks = createHooks();
  const store = createStore(middleware(() => hooks, getAnnounce()));
  Array.from({ length: 4 }).forEach(() => {
    // start
    store.dispatch(initialPublish(initialPublishArgs));
    requestAnimationFrame.step();
    expect(hooks.onDragStart).toHaveBeenCalledWith(
      getDragStart(),
      expect.any(Object),
    );
    expect(hooks.onDragStart).toHaveBeenCalledTimes(1);

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
    expect(hooks.onDragUpdate).toHaveBeenCalledWith(update, expect.any(Object));
    expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);

    // drop
    const result: DropResult = {
      ...update,
      reason: 'DROP',
    };
    store.dispatch(completeDrop(result));
    expect(hooks.onDragEnd).toHaveBeenCalledWith(result, expect.any(Object));
    expect(hooks.onDragEnd).toHaveBeenCalledTimes(1);

    // cleanup
    store.dispatch(clean());
    // $ExpectError - unknown mock reset property
    hooks.onDragStart.mockReset();
    // $ExpectError - unknown mock reset property
    hooks.onDragUpdate.mockReset();
    // $ExpectError - unknown mock reset property
    hooks.onDragEnd.mockReset();
  });
});
