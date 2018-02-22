// @flow
import PropTypes from 'prop-types';
import { storeKey, droppableIdKey, dimensionMarshalKey, styleContextKey, canLiftContextKey } from '../../src/view/context-keys';
import createStore from '../../src/state/create-store';
import createDimensionMarshal from '../../src/state/dimension-marshal/dimension-marshal';
import type { DroppableId } from '../../src/types';
import type { DimensionMarshal } from '../../src/state/dimension-marshal/dimension-marshal-types';
import type { StyleMarshal } from '../../src/view/style-marshal/style-marshal-types';

// Not using this store - just putting it on the context
// For any connected components that need it (eg DimensionPublisher)
export const withStore = () => ({
  context: {
    // Each consumer will get their own store
    [storeKey]: createStore(),
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
    [dimensionMarshalKey]: marshal || createDimensionMarshal({
      cancel: () => { },
      publishDraggable: () => { },
      publishDroppable: () => { },
      updateDroppableScroll: () => { },
      updateDroppableIsEnabled: () => { },
      bulkPublish: () => { },
    }),
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
  args.reduce((previous: Object, current: Object): Object => ({
    context: {
      ...previous.context,
      ...current.context,
    },
    childContextTypes: {
      ...previous.childContextTypes,
      ...current.childContextTypes,
    },
  }), base);
