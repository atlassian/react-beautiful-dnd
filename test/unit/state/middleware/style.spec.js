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
  onDragStartFinished,
} from '../../../../src/state/action-creators';
import {
  initialPublishArgs,
  publishAdditionArgs,
  animateDropArgs,
  completeDropArgs,
} from '../../../utils/preset-action-args';

const getMarshalStub = (): StyleMarshal => ({
  dragging: jest.fn(),
  collecting: jest.fn(),
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

  // dragging styles not applied until after the onDragStart
  store.dispatch(initialPublish(initialPublishArgs));
  expect(marshal.dragging).not.toHaveBeenCalled();

  store.dispatch(onDragStartFinished());
  expect(marshal.dragging).toHaveBeenCalled();
});

it('should use the dragging styles when a dynamic collection is starting', () => {
  const marshal: StyleMarshal = getMarshalStub();
  const store: Store = createStore(middleware(marshal));

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));
  store.dispatch(collectionStarting());

  expect(marshal.collecting).toHaveBeenCalled();
});

// TODO: enable when we support dynamic changes
// eslint-disable-next-line jest/no-disabled-tests
it.skip('should use the dragging styles after a dynamic publish', () => {
  const marshal: StyleMarshal = getMarshalStub();
  const store: Store = createStore(middleware(marshal));

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));
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
