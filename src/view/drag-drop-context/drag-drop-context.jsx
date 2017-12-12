// @flow
import React, { type Node } from 'react';
import PropTypes from 'prop-types';
import createStore from '../../state/create-store';
import fireHooks from '../../state/fire-hooks';
import createDimensionMarshal from '../../state/dimension-marshal/create-dimension-marshal';
import createStyleMarshal from '../style-marshal/create-style-marshal';
import type { Marshal, Callbacks as MarshalCallbacks } from '../../state/dimension-marshal/dimension-marshal-types';
import type {
  Store,
  State,
  Hooks,
  DraggableDimension,
  DroppableDimension,
  DroppableId,
} from '../../types';
import { storeKey, dimensionMarshalKey } from '../context-keys';
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

export default class DragDropContext extends React.Component<Props> {
  /* eslint-disable react/sort-comp */
  store: Store
  marshal: Marshal
  unsubscribe: Function

  // Need to declare childContextTypes without flow
  // https://github.com/brigand/babel-plugin-flow-react-proptypes/issues/22
  static childContextTypes = {
    [storeKey]: PropTypes.shape({
      dispatch: PropTypes.func.isRequired,
      subscribe: PropTypes.func.isRequired,
      getState: PropTypes.func.isRequired,
    }).isRequired,
    [dimensionMarshalKey]: PropTypes.object.isRequired,
  }
  /* eslint-enable */

  getChildContext(): Context {
    return {
      [storeKey]: this.store,
      [dimensionMarshalKey]: this.marshal,
    };
  }

  componentWillMount() {
    this.store = createStore();
    const styleMarshal = createStyleMarshal();

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
    this.marshal = createDimensionMarshal(callbacks);

    let previous: State = this.store.getState();

    this.unsubscribe = this.store.subscribe(() => {
      const previousForThisExecution = previous;
      const current = this.store.getState();
      // setting previous now incase any of the
      // functions synchronously trigger more updates
      previous = current;

      // Allowing dynamic hooks by re-capturing the hook functions
      const hooks: Hooks = {
        onDragStart: this.props.onDragStart,
        onDragEnd: this.props.onDragEnd,
      };
      fireHooks(hooks, current, previousForThisExecution);

      // TEMP
      const isDragStarting: boolean = previousForThisExecution.phase !== 'DRAGGING' && current.phase === 'DRAGGING';
      const isDragStopping: boolean = previousForThisExecution.phase === 'DRAGGING' && current.phase !== 'DRAGGING';

      if (isDragStarting) {
        console.warn('applying dragging styles');
        styleMarshal.apply();
      }
      if (isDragStopping) {
        console.log('removing dragging styles');
        styleMarshal.unapply();
      }

      // inform the dimension marshal about updates
      this.marshal.onStateChange(current, previousForThisExecution);
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    return this.props.children;
  }
}
