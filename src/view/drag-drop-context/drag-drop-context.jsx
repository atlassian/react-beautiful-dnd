// @flow
import React, { type Node } from 'react';
import { bindActionCreators } from 'redux';
import invariant from 'tiny-invariant';
import PropTypes from 'prop-types';
import createStore from '../../state/create-store';
import createDimensionMarshal from '../../state/dimension-marshal/dimension-marshal';
import createStyleMarshal, {
  resetStyleContext,
} from '../style-marshal/style-marshal';
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
import type { DraggableId, State, Handles } from '../../types';
import type { Store } from '../../state/store-types';
import {
  storeKey,
  dimensionMarshalKey,
  styleContextKey,
  canLiftContextKey,
} from '../context-keys';
import {
  clean,
  move,
  publishWhileDragging,
  updateDroppableScroll,
  updateDroppableIsEnabled,
  updateDroppableIsCombineEnabled,
  collectionStarting,
} from '../../state/action-creators';
import { getFormattedMessage } from '../../dev-warning';
import { peerDependencies } from '../../../package.json';
import checkReactVersion from './check-react-version';

type Props = {|
  ...Handles,
  // we do not technically need any children for this component
  children: Node | null,
|};

type Context = {
  [string]: Store,
};

// Reset any context that gets persisted across server side renders
export const resetServerContext = () => {
  resetStyleContext();
};

const printFatalDevError = (error: Error) => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  // eslint-disable-next-line no-console
  console.error(
    ...getFormattedMessage(
      `
      An error has occurred while a drag is occurring.
      Any existing drag will be cancelled.

      > ${error.message}
      `,
    ),
  );
  // eslint-disable-next-line no-console
  console.error('raw', error);
};

export default class DragDropContext extends React.Component<Props> {
  /* eslint-disable react/sort-comp */
  store: Store;
  dimensionMarshal: DimensionMarshal;
  styleMarshal: StyleMarshal;
  autoScroller: AutoScroller;
  announcer: Announcer;
  unsubscribe: Function;

  constructor(props: Props, context: mixed) {
    super(props, context);

    // A little setup check for dev
    if (process.env.NODE_ENV !== 'production') {
      invariant(
        typeof props.onDragEnd === 'function',
        'A DragDropContext requires an onDragEnd function to perform reordering logic',
      );
    }

    this.announcer = createAnnouncer();

    // create the style marshal
    this.styleMarshal = createStyleMarshal();

    this.store = createStore({
      // Lazy reference to dimension marshal get around circular dependency
      getDimensionMarshal: (): DimensionMarshal => this.dimensionMarshal,
      styleMarshal: this.styleMarshal,
      // This is a function as users are allowed to change their handle functions
      // at any time
      getHandles: (): Handles => ({
        onBeforeDragStart: this.props.onBeforeDragStart,
        onDragStart: this.props.onDragStart,
        onDragEnd: this.props.onDragEnd,
        onDragUpdate: this.props.onDragUpdate,
      }),
      announce: this.announcer.announce,
      getScroller: () => this.autoScroller,
    });
    const callbacks: DimensionMarshalCallbacks = bindActionCreators(
      {
        publishWhileDragging,
        updateDroppableScroll,
        updateDroppableIsEnabled,
        updateDroppableIsCombineEnabled,
        collectionStarting,
      },
      this.store.dispatch,
    );
    this.dimensionMarshal = createDimensionMarshal(callbacks);

    this.autoScroller = createAutoScroller({
      scrollWindow,
      scrollDroppable: this.dimensionMarshal.scrollDroppable,
      ...bindActionCreators(
        {
          move,
        },
        this.store.dispatch,
      ),
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
  };

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

  componentDidMount() {
    window.addEventListener('error', this.onWindowError);
    this.styleMarshal.mount();
    this.announcer.mount();

    if (process.env.NODE_ENV !== 'production') {
      checkReactVersion(peerDependencies.react, React.version);
    }
  }

  componentDidCatch(error: Error) {
    this.onFatalError(error);

    // If the failure was due to an invariant failure - then we handle the error
    if (error.message.indexOf('Invariant failed') !== -1) {
      this.setState({});
      return;
    }

    // Error is more serious and we throw it
    throw error;
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.onWindowError);

    const state: State = this.store.getState();
    if (state.phase !== 'IDLE') {
      this.store.dispatch(clean());
    }

    this.styleMarshal.unmount();
    this.announcer.unmount();
  }

  onFatalError = (error: Error) => {
    printFatalDevError(error);

    const state: State = this.store.getState();
    if (state.phase !== 'IDLE') {
      this.store.dispatch(clean());
    }
  };

  onWindowError = (error: Error) => this.onFatalError(error);

  render() {
    return this.props.children;
  }
}
