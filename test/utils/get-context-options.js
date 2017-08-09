// @flow
import PropTypes from 'prop-types';
import { storeKey, droppableIdKey } from '../../src/view/context-keys';
import createStore from '../../src/state/create-store';
import type { DroppableId } from '../../src/types';

// Not using this store - just putting it on the context
// For any connected components that need it (eg DimensionPublisher)
export const withStore = () => ({
  context: {
    // Each consumer will get their own store
    [storeKey]: createStore({ onDragEnd: () => { } }),
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
