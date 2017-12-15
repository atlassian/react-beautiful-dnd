// @flow
import React, { type Node } from 'react';
import PropTypes from 'prop-types';
import createStore from '../../state/create-store';
import fireHooks from '../../state/fire-hooks';
import createDimensionMarshal from '../../state/dimension-marshal/dimension-marshal';
import createStyleMarshal from '../style-marshal/style-marshal';
import type { DimensionMarshal, Callbacks as MarshalCallbacks } from '../../state/dimension-marshal/dimension-marshal-types';
import type {
  Store,
  State,
  Hooks,
  DraggableDimension,
  DroppableDimension,
  DroppableId,
  Position,
} from '../../types';
import { storeKey, dimensionMarshalKey, draggableClassNameKey } from '../context-keys';
import {
  clean,
  publishDraggableDimensions,
  publishDroppableDimensions,
  updateDroppableDimensionScroll,
} from '../../state/action-creators';

type Props = {|
  ...Hooks,
  children: ?Node,
|}

type Context = {
  [string]: Store
}

const createDraggableClassName = (() => {
  const prefix: string = 'react-beautiful-dnd-draggable';
  let count: number = 0;

  return () => `${prefix}-${count++}`;
})();

export default class DragDropContext extends React.Component<Props> {
  /* eslint-disable react/sort-comp */
  store: Store
  dimensionMarshal: DimensionMarshal
  unsubscribe: Function
  draggableClassName: string

  // Need to declare childContextTypes without flow
  // https://github.com/brigand/babel-plugin-flow-react-proptypes/issues/22
  static childContextTypes = {
    [storeKey]: PropTypes.shape({
      dispatch: PropTypes.func.isRequired,
      subscribe: PropTypes.func.isRequired,
      getState: PropTypes.func.isRequired,
    }).isRequired,
    [dimensionMarshalKey]: PropTypes.object.isRequired,
    [draggableClassNameKey]: PropTypes.string.isRequired,
  }
  /* eslint-enable */

  getChildContext(): Context {
    return {
      [storeKey]: this.store,
      [dimensionMarshalKey]: this.dimensionMarshal,
      [draggableClassNameKey]: this.draggableClassName,
    };
  }

  componentWillMount() {
    this.store = createStore();
    this.draggableClassName = createDraggableClassName();
    const styleMarshal = createStyleMarshal(this.draggableClassName);

    // set up the dimension marshal
    const callbacks: MarshalCallbacks = {
      cancel: () => {
        this.store.dispatch(clean());
      },
      publishDraggables: (dimensions: DraggableDimension[]) => {
        this.store.dispatch(publishDraggableDimensions(dimensions));
      },
      publishDroppables: (dimensions: DroppableDimension[]) => {
        this.store.dispatch(publishDroppableDimensions(dimensions));
      },
      updateDroppableScroll: (id: DroppableId, offset: Position) => {
        this.store.dispatch(updateDroppableDimensionScroll(id, offset));
      },
    };
    this.dimensionMarshal = createDimensionMarshal(callbacks);

    let previous: State = this.store.getState();

    this.unsubscribe = this.store.subscribe(() => {
      const previousValue: State = previous;
      const current = this.store.getState();
      // setting previous now incase any of the
      // functions synchronously trigger more updates
      previous = current;

      // no lifecycle changes have occurred if phase has not changed
      if (current.phase === previousValue.phase) {
        return;
      }

      // Allowing dynamic hooks by re-capturing the hook functions
      const hooks: Hooks = {
        onDragStart: this.props.onDragStart,
        onDragEnd: this.props.onDragEnd,
      };
      fireHooks(hooks, current, previousValue);

      // Update the global styles
      styleMarshal.onStateChange(current, previousValue);

      // inform the dimension marshal about updates
      // this can trigger more actions synchronously so we are placing it last
      this.dimensionMarshal.onStateChange(current.phase, current.dimension.request);
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    return this.props.children;
  }
}
