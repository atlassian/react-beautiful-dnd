// @flow
import { Component } from 'react';
import PropTypes from 'prop-types';
import createStore from '../../state/create-store';
import fireHooks from '../../state/fire-hooks';
import type {
  Store,
  State,
  Hooks,
  ReactElement,
} from '../../types';
import { storeKey } from '../context-keys';

type Props = Hooks & {
  children: ?ReactElement,
}

type Context = {
  [string]: Store
}

export default class DragDropContext extends Component {
  /* eslint-disable react/sort-comp */
  props: Props
  store: Store
  unsubscribe: Function

  // Need to declare childContextTypes without flow
  // https://github.com/brigand/babel-plugin-flow-react-proptypes/issues/22
  static childContextTypes = {
    [storeKey]: PropTypes.shape({
      dispatch: PropTypes.func.isRequired,
      subscribe: PropTypes.func.isRequired,
      getState: PropTypes.func.isRequired,
    }).isRequired,
  }
  /* eslint-enable */

  getChildContext(): Context {
    return {
      [storeKey]: this.store,
    };
  }

  componentWillMount() {
    this.store = createStore();

    let previous: State = this.store.getState();

    this.unsubscribe = this.store.subscribe(() => {
      const current = this.store.getState();

      // Allowing dynamic hooks by re-capturing the hook functions
      const hooks: Hooks = {
        onDragStart: this.props.onDragStart,
        onDragEnd: this.props.onDragEnd,
      };

      fireHooks(hooks, current, previous);
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
