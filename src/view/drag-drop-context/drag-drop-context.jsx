// @flow
import React, { type Node } from 'react';
import PropTypes from 'prop-types';
import createStore from '../../state/create-store';
import fireHooks from '../../state/fire-hooks';
import createDimensionMarshal from '../../state/dimension-marshal/create-dimension-marshal';
import type { Marshal } from '../../state/dimension-marshal/dimension-marshal-types';
import type {
  Store,
  State,
  Hooks,
} from '../../types';
import { storeKey, dimensionMarshalKey } from '../context-keys';

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
    console.log('putting marshal on context', this.marshal);
    return {
      [storeKey]: this.store,
      [dimensionMarshalKey]: this.marshal,
    };
  }

  componentWillMount() {
    this.store = createStore();
    this.marshal = createDimensionMarshal(this.store.dispatch);

    let previous: State = this.store.getState();

    this.unsubscribe = this.store.subscribe(() => {
      const current = this.store.getState();

      // Allowing dynamic hooks by re-capturing the hook functions
      const hooks: Hooks = {
        onDragStart: this.props.onDragStart,
        onDragEnd: this.props.onDragEnd,
      };
      fireHooks(hooks, current, previous);

      this.marshal.onStateChange(current, previous);

      previous = current;
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    return this.props.children;
  }
}
