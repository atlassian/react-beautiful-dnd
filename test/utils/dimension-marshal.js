// @flow
import { bindActionCreators } from 'redux';
import create from '../../src/state/dimension-marshal/dimension-marshal';
import {
  publishWhileDragging,
  updateDroppableScroll,
  updateDroppableIsEnabled,
  updateDroppableIsCombineEnabled,
  collectionStarting,
} from '../../src/state/action-creators';
import type {
  DimensionMarshal,
  Callbacks,
} from '../../src/state/dimension-marshal/dimension-marshal-types';
import type { Registry } from '../../src/state/registry/registry-types';

export const createMarshal = (
  registry: Registry,
  dispatch: Function,
): DimensionMarshal => {
  const callbacks: Callbacks = bindActionCreators(
    {
      publishWhileDragging,
      collectionStarting,
      updateDroppableScroll,
      updateDroppableIsEnabled,
      updateDroppableIsCombineEnabled,
    },
    dispatch,
  );

  return create(registry, callbacks);
};

export const getMarshalStub = (): DimensionMarshal => ({
  updateDroppableScroll: jest.fn(),
  updateDroppableIsEnabled: jest.fn(),
  updateDroppableIsCombineEnabled: jest.fn(),
  scrollDroppable: jest.fn(),
  startPublishing: jest.fn(),
  stopPublishing: jest.fn(),
});

export const getCallbacksStub = (): Callbacks => ({
  publishWhileDragging: jest.fn(),
  updateDroppableScroll: jest.fn(),
  updateDroppableIsEnabled: jest.fn(),
  updateDroppableIsCombineEnabled: jest.fn(),
  collectionStarting: jest.fn(),
});
