// @flow
import React, { type Node } from 'react';
import PropTypes from 'prop-types';
import createStore from '../../state/create-store';
import fireHooks from '../../state/fire-hooks';
import createDimensionMarshal from '../../state/dimension-marshal/dimension-marshal';
import createStyleMarshal from '../style-marshal/style-marshal';
import canStartDrag from '../../state/can-start-drag';
import createAutoScroll from '../../state/auto-scroll-marshal/auto-scroll-marshal';
import type { AutoScrollMarshal } from '../../state/auto-scroll-marshal/auto-scroll-marshal-types';
import type { StyleMarshal } from '../style-marshal/style-marshal-types';
import type {
  DimensionMarshal,
  Callbacks as DimensionMarshalCallbacks,
} from '../../state/dimension-marshal/dimension-marshal-types';
import type {
  DraggableId,
  Store,
  State,
  Hooks,
  DraggableDimension,
  DroppableDimension,
  DroppableId,
  Position,
} from '../../types';
import {
  storeKey,
  dimensionMarshalKey,
  styleContextKey,
  canLiftContextKey,
} from '../context-keys';
import {
  clean,
  publishDraggableDimensions,
  publishDroppableDimensions,
  updateDroppableDimensionScroll,
  updateDroppableDimensionIsEnabled,
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
  dimensionMarshal: DimensionMarshal
  styleMarshal: StyleMarshal
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
    [styleContextKey]: PropTypes.string.isRequired,
    [canLiftContextKey]: PropTypes.func.isRequired,
  }
  /* eslint-enable */

  getChildContext(): Context {
    return {
      [storeKey]: this.store,
      [dimensionMarshalKey]: this.dimensionMarshal,
      [styleContextKey]: this.styleMarshal.styleContext,
      [canLiftContextKey]: this.canLift,
    };
  }

  // Providing function on the context for drag handles to use to
  // let them know if they can start a drag or not. This is done
  // rather than mapping a prop onto the drag handle so that we
  // do not need to re-render a connected drag handle in order to
  // pull this state off. It would cause a re-render of all items
  // on drag start which is too expensive.
  // This is useful when the user
  canLift = (id: DraggableId) => canStartDrag(this.store.getState(), id);

  componentWillMount() {
    this.store = createStore();

    // create the style marshal
    this.styleMarshal = createStyleMarshal();

    // create the dimension marshal
    const callbacks: DimensionMarshalCallbacks = {
      cancel: () => {
        this.store.dispatch(clean());
      },
      publishDraggables: (dimensions: DraggableDimension[]) => {
        this.store.dispatch(publishDraggableDimensions(dimensions));
      },
      publishDroppables: (dimensions: DroppableDimension[]) => {
        this.store.dispatch(publishDroppableDimensions(dimensions));
      },
      updateDroppableScroll: (id: DroppableId, newScroll: Position) => {
        this.store.dispatch(updateDroppableDimensionScroll(id, newScroll));
      },
      updateDroppableIsEnabled: (id: DroppableId, isEnabled: boolean) => {
        this.store.dispatch(updateDroppableDimensionIsEnabled(id, isEnabled));
      },
    };
    this.dimensionMarshal = createDimensionMarshal(callbacks);
    const scrollMarshal: AutoScrollMarshal = createAutoScroll();

    let previous: State = this.store.getState();

    this.unsubscribe = this.store.subscribe(() => {
      const previousValue: State = previous;
      const current = this.store.getState();
      // setting previous now incase any of the
      // functions synchronously trigger more updates
      previous = current;

      if (current.phase === 'DRAGGING') {
        scrollMarshal.onDrag(current);
      }

      // no lifecycle changes have occurred if phase has not changed

      if (current.phase === previousValue.phase) {
        return;
      }

      // Allowing dynamic hooks by re-capturing the hook functions
      const hooks: Hooks = {
        onDragStart: this.props.onDragStart,
        onDragEnd: this.props.onDragEnd,
      };
      fireHooks(hooks, previousValue, current);

      // Update the global styles
      this.styleMarshal.onPhaseChange(current);

      // inform the dimension marshal about updates
      // this can trigger more actions synchronously so we are placing it last
      this.dimensionMarshal.onPhaseChange(current);
    });
  }

  componentDidMount() {
    // need to mount the style marshal after we are in the dom
    // this cannot be done before otherwise it would break
    // server side rendering
    this.styleMarshal.mount();
  }

  componentWillUnmount() {
    this.unsubscribe();
    this.styleMarshal.unmount();
  }

  render() {
    return this.props.children;
  }
}
