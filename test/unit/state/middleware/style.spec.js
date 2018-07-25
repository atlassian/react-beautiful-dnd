// @flow
import middleware from '../../../../src/state/middleware/style';
import type { StyleMarshal } from '../../../../src/view/style-marshal/style-marshal-types';
import type { Store } from '../../../../src/state/store-types';
import createStore from './util/create-store';
import {
  initialPublish,
  prepare,
  collectionStarting,
  publish,
  animateDrop,
  completeDrop,
  clean,
} from '../../../../src/state/action-creators';
import {
  initialPublishArgs,
  publishAdditionArgs,
  animateDropArgs,
  completeDropArgs,
  initialPublishWithScrollableHome,
} from '../../../utils/preset-action-args';

const getMarshalStub = (): StyleMarshal => ({
  dragging: jest.fn(),
  dropping: jest.fn(),
  resting: jest.fn(),
  mount: jest.fn(),
  unmount: jest.fn(),
  styleContext: 'why hello there',
});

it('should use the dragging styles on an initial publish', () => {
  const marshal: StyleMarshal = getMarshalStub();
  const store: Store = createStore(middleware(marshal));

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));

  expect(marshal.dragging).toHaveBeenCalled();
});

it('should use the dragging styles after a dynamic publish', () => {
  const marshal: StyleMarshal = getMarshalStub();
  const store: Store = createStore(middleware(marshal));

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishWithScrollableHome));
  marshal.dragging.mockReset();

  store.dispatch(collectionStarting());
  expect(marshal.dragging).not.toHaveBeenCalled();

  store.dispatch(publish(publishAdditionArgs));
  expect(marshal.dragging).toHaveBeenCalled();
});

it('should use the dropping styles when drop animating', () => {
  const marshal: StyleMarshal = getMarshalStub();
  const store: Store = createStore(middleware(marshal));

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));
  store.dispatch(animateDrop(animateDropArgs));

  expect(marshal.dropping).toHaveBeenCalledWith(animateDropArgs.result.reason);
});

it('should use the resting styles when a drop completes', () => {
  const marshal: StyleMarshal = getMarshalStub();
  const store: Store = createStore(middleware(marshal));

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));

  expect(marshal.resting).not.toHaveBeenCalled();
  store.dispatch(completeDrop(completeDropArgs));

  expect(marshal.resting).toHaveBeenCalled();
});

it('should use the resting styles when aborting', () => {
  const marshal: StyleMarshal = getMarshalStub();
  const store: Store = createStore(middleware(marshal));

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));

  expect(marshal.resting).not.toHaveBeenCalled();
  store.dispatch(clean());

  expect(marshal.resting).toHaveBeenCalled();
});
