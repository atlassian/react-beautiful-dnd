// @flow
import middleware from '../../../../src/state/middleware/style';
import type { StyleMarshal } from '../../../../src/view/use-style-marshal/style-marshal-types';
import type { DropReason } from '../../../../src/types';
import type { Store } from '../../../../src/state/store-types';
import createStore from './util/create-store';
import {
  initialPublish,
  animateDrop,
  completeDrop,
  clean,
} from '../../../../src/state/action-creators';
import {
  initialPublishArgs,
  animateDropArgs,
  getCompletedArgs,
} from '../../../util/preset-action-args';

const getMarshalStub = (): StyleMarshal => ({
  dragging: jest.fn(),
  dropping: jest.fn(),
  resting: jest.fn(),
});

it('should use the dragging styles on an initial publish', () => {
  const marshal: StyleMarshal = getMarshalStub();
  const store: Store = createStore(middleware(marshal));

  store.dispatch(initialPublish(initialPublishArgs));

  expect(marshal.dragging).toHaveBeenCalled();
});

it('should use the dropping styles when drop animating', () => {
  const marshal: StyleMarshal = getMarshalStub();
  const store: Store = createStore(middleware(marshal));

  store.dispatch(initialPublish(initialPublishArgs));
  store.dispatch(animateDrop(animateDropArgs));

  expect(marshal.dropping).toHaveBeenCalledWith(
    animateDropArgs.completed.result.reason,
  );
});

it('should use the resting styles when a drop completes', () => {
  ['DROP', 'CANCEL'].forEach((reason: DropReason) => {
    const marshal: StyleMarshal = getMarshalStub();
    const store: Store = createStore(middleware(marshal));

    store.dispatch(initialPublish(initialPublishArgs));

    expect(marshal.resting).not.toHaveBeenCalled();
    store.dispatch(completeDrop(getCompletedArgs(reason)));

    expect(marshal.resting).toHaveBeenCalled();
  });
});

it('should use the resting styles when aborting', () => {
  const marshal: StyleMarshal = getMarshalStub();
  const store: Store = createStore(middleware(marshal));

  store.dispatch(initialPublish(initialPublishArgs));

  expect(marshal.resting).not.toHaveBeenCalled();
  store.dispatch(clean());

  expect(marshal.resting).toHaveBeenCalled();
});
