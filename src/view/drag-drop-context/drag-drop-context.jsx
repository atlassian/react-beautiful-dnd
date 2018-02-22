// @flow
import React, { type Node } from 'react';
import PropTypes from 'prop-types';
import createStore from '../../state/create-store';
import createHookCaller from '../../state/hooks/hook-caller';
import createDimensionMarshal from '../../state/dimension-marshal/dimension-marshal';
import createStyleMarshal from '../style-marshal/style-marshal';
import canStartDrag from '../../state/can-start-drag';
import scrollWindow from '../../window/scroll-window';
import createAnnouncer from '../announcer/announcer';
import type { Announcer } from '../announcer/announcer-types';
import createAutoScroller from '../../state/auto-scroller';
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
  DraggableDimension,
  DroppableDimension,
  DroppableId,
  Position,
  Hooks,
} from '../../types';
import type {
  HookCaller,
} from '../../state/hooks/hooks-types';
import {
  storeKey,
  dimensionMarshalKey,
  styleContextKey,
  canLiftContextKey,
} from '../context-keys';
import {
  clean,
  move,
  publishDraggableDimension,
  publishDroppableDimension,
  updateDroppableDimensionScroll,
  updateDroppableDimensionIsEnabled,
  bulkPublishDimensions,
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
  autoScroller: AutoScroller
  hookCaller: HookCaller
  announcer: Announcer
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

    this.announcer = createAnnouncer();

    // create the hook caller
    this.hookCaller = createHookCaller(this.announcer.announce);

    // create the style marshal
    this.styleMarshal = createStyleMarshal();

    // create the dimension marshal
    const callbacks: DimensionMarshalCallbacks = {
      cancel: () => {
        this.store.dispatch(clean());
      },
      publishDraggable: (dimension: DraggableDimension) => {
        this.store.dispatch(publishDraggableDimension(dimension));
      },
      publishDroppable: (dimension: DroppableDimension) => {
        this.store.dispatch(publishDroppableDimension(dimension));
      },
      bulkPublish: (droppables: DroppableDimension[], draggables: DraggableDimension[]) => {
        this.store.dispatch(bulkPublishDimensions(droppables, draggables));
      },
      updateDroppableScroll: (id: DroppableId, newScroll: Position) => {
        this.store.dispatch(updateDroppableDimensionScroll(id, newScroll));
      },
      updateDroppableIsEnabled: (id: DroppableId, isEnabled: boolean) => {
        this.store.dispatch(updateDroppableDimensionIsEnabled(id, isEnabled));
      },
    };
    this.dimensionMarshal = createDimensionMarshal(callbacks);
    this.autoScroller = createAutoScroller({
      scrollWindow,
      scrollDroppable: this.dimensionMarshal.scrollDroppable,
      move: (
        id: DraggableId,
        client: Position,
        windowScroll: Position,
        shouldAnimate?: boolean
      ): void => {
        this.store.dispatch(move(id, client, windowScroll, shouldAnimate));
      },
    });

    let previous: State = this.store.getState();

    this.unsubscribe = this.store.subscribe(() => {
      const previousValue: State = previous;
      const current = this.store.getState();
      // setting previous now incase any of the
      // functions synchronously trigger more updates
      previous = current;

      // TODO: this probs needs to be done first
      const hooks: Hooks = {
        onDragStart: this.props.onDragStart,
        onDragEnd: this.props.onDragEnd,
        onDragUpdate: this.props.onDragUpdate,
      };
      this.hookCaller.onStateChange(hooks, previousValue, current);

      if (current.phase !== previousValue.phase) {
        // executing phase change handlers first
        // Update the global styles
        this.styleMarshal.onPhaseChange(current);

        // inform the dimension marshal about updates
        // this can trigger more actions synchronously so we are placing it last
        this.dimensionMarshal.onPhaseChange(current);
      }

      this.autoScroller.onStateChange(previousValue, current);
    });
  }

  componentDidMount() {
    // need to mount the style marshal after we are in the dom
    // this cannot be done before otherwise it would break
    // server side rendering
    this.styleMarshal.mount();
    this.announcer.mount();
  }

  componentWillUnmount() {
    this.unsubscribe();
    this.styleMarshal.unmount();
    this.announcer.unmount();
  }

  render() {
    return this.props.children;
  }
}
