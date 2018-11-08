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

it('should call the onDragEnd handle when a DROP_COMPLETE action occurs', () => {
  const handles: Handles = getHandles();
  const store: Store = createStore(middleware(() => handles, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));
  jest.runOnlyPendingTimers();
  expect(handles.onDragStart).toHaveBeenCalledTimes(1);

  store.dispatch(completeDrop(result));
  expect(handles.onDragEnd).toHaveBeenCalledWith(result, expect.any(Object));
});

it('should throw an exception if there was no drag start published', () => {
  const handles: Handles = getHandles();
  const store: Store = createStore(middleware(() => handles, getAnnounce()));

  // throws when in idle
  expect(() => store.dispatch(completeDrop(result))).toThrow();
});
