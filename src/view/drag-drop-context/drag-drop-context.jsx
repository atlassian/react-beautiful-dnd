// @flow
import React, { type Node } from 'react';
import { type Position } from 'css-box-model';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import createStore from '../../state/create-store';
import createDimensionMarshal from '../../state/dimension-marshal/dimension-marshal';
import createStyleMarshal, { resetStyleContext } from '../style-marshal/style-marshal';
import canStartDrag from '../../state/can-start-drag';
import scrollWindow from '../window/scroll-window';
import createAnnouncer from '../announcer/announcer';
import createAutoScroller from '../../state/auto-scroller';
import type { Announcer } from '../announcer/announcer-types';
import type { AutoScroller } from '../../state/auto-scroller/auto-scroller-types';
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
  Viewport,
} from '../../types';
import {
  storeKey,
  dimensionMarshalKey,
  styleContextKey,
  canLiftContextKey,
} from '../context-keys';
import {
  clean,
  move,
  bulkReplace,
  updateDroppableScroll,
  updateDroppableIsEnabled,
} from '../../state/action-creators';

type Props = {|
  ...Hooks,
  children: ?Node,
|}

type Context = {
  [string]: Store
}

// Reset any context that gets persisted across server side renders
export const resetServerContext = () => {
  resetStyleContext();
};

export default class DragDropContext extends React.Component<Props> {
  /* eslint-disable react/sort-comp */
  store: Store
  dimensionMarshal: DimensionMarshal
  styleMarshal: StyleMarshal
  autoScroller: AutoScroller
  announcer: Announcer
  unsubscribe: Function

  constructor(props: Props, context: mixed) {
    super(props, context);

    this.announcer = createAnnouncer();

    // create the style marshal
    this.styleMarshal = createStyleMarshal();

    this.store = createStore({
      // Lazy reference to dimension marshal get around circular dependency
      getDimensionMarshal: (): DimensionMarshal => this.dimensionMarshal,
      styleMarshal: this.styleMarshal,
      // This is a function as users are allowed to change their hook functions
      // at any time
      getHooks: (): Hooks => ({
        onDragStart: this.props.onDragStart,
        onDragEnd: this.props.onDragEnd,
        onDragUpdate: this.props.onDragUpdate,
      }),
      announce: this.announcer.announce,
    });
    const callbacks: DimensionMarshalCallbacks = bindActionCreators({
      bulkReplace,
      updateDroppableScroll,
      updateDroppableIsEnabled,
    }, this.store.dispatch);
    this.dimensionMarshal = createDimensionMarshal(callbacks);

    this.autoScroller = createAutoScroller({
      scrollWindow,
      scrollDroppable: this.dimensionMarshal.scrollDroppable,
      move: (
        id: DraggableId,
        client: Position,
        viewport: Viewport,
        shouldAnimate?: boolean
      ): void => {
        this.store.dispatch(move(id, client, viewport, shouldAnimate));
      },
    });
  }
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

  componentDidCatch(error: Error) {
    console.warn('Error caught in DragDropContext. Cancelling any drag', error);
    this.store.dispatch(clean());

    // Not swallowing the error - letting it pass through
    throw error;
  }

  onWindowError = (error: Error) => {
    const state: State = this.store.getState();

    if (state.phase === 'IDLE') {
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.warn(`
        An error has occurred while a drag is occurring.
        Any existing drag will be cancelled
      `, error);
    }

    this.store.dispatch(clean());
  }

  componentDidMount() {
    window.addEventListener('error', this.onWindowError);
    this.styleMarshal.mount();
    this.announcer.mount();
  }

  componentWillUnmount() {
    window.addEventListener('error', this.onWindowError);
    // TODO: is this the right way to cleanup?
    this.store.dispatch(clean());
    this.styleMarshal.unmount();
    this.announcer.unmount();
  }

  render() {
    return this.props.children;
  }
}
