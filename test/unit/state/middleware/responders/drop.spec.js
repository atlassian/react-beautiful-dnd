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

it('should call the onDragEnd responder when a DROP_COMPLETE action occurs', () => {
  const responders: Responders = getResponders();
  const store: Store = createStore(middleware(() => responders, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));
  jest.runOnlyPendingTimers();
  expect(responders.onDragStart).toHaveBeenCalledTimes(1);

  store.dispatch(completeDrop(result));
  expect(responders.onDragEnd).toHaveBeenCalledWith(result, expect.any(Object));
});

it('should throw an exception if there was no drag start published', () => {
  const responders: Responders = getResponders();
  const store: Store = createStore(middleware(() => responders, getAnnounce()));

  // throws when in idle
  expect(() => store.dispatch(completeDrop(result))).toThrow();
});
