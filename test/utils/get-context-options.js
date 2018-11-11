// @flow
import PropTypes from 'prop-types';
import {
  storeKey,
  droppableIdKey,
  dimensionMarshalKey,
  styleContextKey,
  canLiftContextKey,
  droppableTypeKey,
} from '../../src/view/context-keys';
import createStore from '../../src/state/create-store';
import { getMarshalStub } from './dimension-marshal';
import type { DroppableId, TypeId } from '../../src/types';
import type { DimensionMarshal } from '../../src/state/dimension-marshal/dimension-marshal-types';
import type { StyleMarshal } from '../../src/view/style-marshal/style-marshal-types';
import type { AutoScroller } from '../../src/state/auto-scroller/auto-scroller-types';

// Not using this store - just putting it on the context
// For any connected components that need it (eg DimensionPublisher)
export const withStore = () => ({
  context: {
    // Each consumer will get their own store
    [storeKey]: createStore({
      getDimensionMarshal: () => getMarshalStub(),
      styleMarshal: {
        dragging: jest.fn(),
        dropping: jest.fn(),
        resting: jest.fn(),
        styleContext: 'fake-style-context',
        unmount: jest.fn(),
        mount: jest.fn(),
      },
      getResponders: () => ({
        onDragEnd: () => {},
      }),
      announce: () => {},
      getScroller: (): AutoScroller => ({
        cancel: jest.fn(),
        jumpScroll: jest.fn(),
        fluidScroll: jest.fn(),
      }),
    }),
  },
  childContextTypes: {
    [storeKey]: PropTypes.shape({
      dispatch: PropTypes.func.isRequired,
      subscribe: PropTypes.func.isRequired,
      getState: PropTypes.func.isRequired,
    }).isRequired,
  },
});

export const withDroppableId = (droppableId: DroppableId): Object => ({
  context: {
    [droppableIdKey]: droppableId,
  },
  childContextTypes: {
    [droppableIdKey]: PropTypes.string.isRequired,
  },
});

export const withDroppableType = (type: TypeId): Object => ({
  context: {
    [droppableTypeKey]: type,
  },
  childContextTypes: {
    [droppableTypeKey]: PropTypes.string.isRequired,
  },
});

export const withStyleContext = (marshal?: StyleMarshal): Object => ({
  context: {
    [styleContextKey]: marshal ? marshal.styleContext : 'fake-style-context',
  },
  childContextTypes: {
    [styleContextKey]: PropTypes.string.isRequired,
  },
});

export const withCanLift = (): Object => ({
  context: {
    [canLiftContextKey]: () => true,
  },
  childContextTypes: {
    [canLiftContextKey]: PropTypes.func.isRequired,
  },
});

export const withDimensionMarshal = (marshal?: DimensionMarshal): Object => ({
  context: {
    [dimensionMarshalKey]: marshal || getMarshalStub(),
  },
  childContextTypes: {
    [dimensionMarshalKey]: PropTypes.object.isRequired,
  },
});

const base: Object = {
  context: {},
  childContextTypes: {},
};

// returning type Object because that is what enzyme wants
export const combine = (...args: Object[]): Object =>
  args.reduce(
    (previous: Object, current: Object): Object => ({
      context: {
        ...previous.context,
        ...current.context,
      },
      childContextTypes: {
        ...previous.childContextTypes,
        ...current.childContextTypes,
      },
    }),
    base,
  );
