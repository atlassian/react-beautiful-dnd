// @flow
import React, { useEffect, useRef, type Node } from 'react';
import invariant from 'tiny-invariant';
import { bindActionCreators } from 'redux';
import { Provider } from 'react-redux';
import { useMemo, useCallback } from 'use-memo-one';
import createStore from '../../state/create-store';
import createDimensionMarshal from '../../state/dimension-marshal/dimension-marshal';
import canStartDrag from '../../state/can-start-drag';
import scrollWindow from '../window/scroll-window';
import createAutoScroller from '../../state/auto-scroller';
import useStyleMarshal from '../use-style-marshal/use-style-marshal';
import type { AutoScroller } from '../../state/auto-scroller/auto-scroller-types';
import type { StyleMarshal } from '../use-style-marshal/style-marshal-types';
import type {
  DimensionMarshal,
  Callbacks as DimensionMarshalCallbacks,
} from '../../state/dimension-marshal/dimension-marshal-types';
import type { DraggableId, State, Responders, Announce } from '../../types';
import type { Store, Action } from '../../state/store-types';
import StoreContext from '../context/store-context';
import {
  clean,
  move,
  publishWhileDragging,
  updateDroppableScroll,
  updateDroppableIsEnabled,
  updateDroppableIsCombineEnabled,
  collectionStarting,
} from '../../state/action-creators';
import isMovementAllowed from '../../state/is-movement-allowed';
import useAnnouncer from '../use-announcer';
import AppContext, { type AppContextValue } from '../context/app-context';
import useStartupValidation from './use-startup-validation';
import usePrevious from '../use-previous-ref';
import { warning } from '../../dev-warning';
import useSensorMarshal from '../use-sensor-marshal/use-sensor-marshal';

type Props = {|
  ...Responders,
  contextId: string,
  setOnError: (onError: Function) => void,
  // we do not technically need any children for this component
  children: Node | null,
|};

const createResponders = (props: Props): Responders => ({
  onBeforeDragStart: props.onBeforeDragStart,
  onDragStart: props.onDragStart,
  onDragEnd: props.onDragEnd,
  onDragUpdate: props.onDragUpdate,
});

// flow does not support MutableRefObject
// type LazyStoreRef = MutableRefObject<?Store>;
type LazyStoreRef = {| current: ?Store |};

function getStore(lazyRef: LazyStoreRef): Store {
  invariant(lazyRef.current, 'Could not find store from lazy ref');
  return lazyRef.current;
}

export default function App(props: Props) {
  const { contextId, setOnError } = props;
  const lazyStoreRef: LazyStoreRef = useRef<?Store>(null);

  useStartupValidation();

  // lazy collection of responders using a ref - update on ever render
  const lastPropsRef = usePrevious<Props>(props);

  const getResponders: () => Responders = useCallback(() => {
    return createResponders(lastPropsRef.current);
  }, [lastPropsRef]);

  const announce: Announce = useAnnouncer(contextId);
  const styleMarshal: StyleMarshal = useStyleMarshal(contextId);

  const lazyDispatch: Action => void = useCallback((action: Action): void => {
    getStore(lazyStoreRef).dispatch(action);
  }, []);

  const callbacks: DimensionMarshalCallbacks = useMemo(
    () =>
      bindActionCreators(
        {
          publishWhileDragging,
          updateDroppableScroll,
          updateDroppableIsEnabled,
          updateDroppableIsCombineEnabled,
          collectionStarting,
        },
        // $FlowFixMe - not sure why this is wrong
        lazyDispatch,
      ),
    [lazyDispatch],
  );
  const dimensionMarshal: DimensionMarshal = useMemo<DimensionMarshal>(
    () => createDimensionMarshal(callbacks),
    [callbacks],
  );

  const autoScroller: AutoScroller = useMemo<AutoScroller>(
    () =>
      createAutoScroller({
        scrollWindow,
        scrollDroppable: dimensionMarshal.scrollDroppable,
        ...bindActionCreators(
          {
            move,
          },
          // $FlowFixMe - not sure why this is wrong
          lazyDispatch,
        ),
      }),
    [dimensionMarshal.scrollDroppable, lazyDispatch],
  );

  const store: Store = useMemo<Store>(
    () =>
      createStore({
        dimensionMarshal,
        styleMarshal,
        announce,
        autoScroller,
        getResponders,
      }),
    [announce, autoScroller, dimensionMarshal, getResponders, styleMarshal],
  );

  // Checking for unexpected store changes
  if (process.env.NODE_ENV !== 'production') {
    if (lazyStoreRef.current && lazyStoreRef.current !== store) {
      warning('unexpected store change');
    }
  }

  // assigning lazy store ref
  lazyStoreRef.current = store;

  const tryResetStore = useCallback(() => {
    const current: Store = getStore(lazyStoreRef);
    const state: State = current.getState();
    if (state.phase !== 'IDLE') {
      current.dispatch(clean({ shouldFlush: true }));
    }
  }, []);

  // doing this in render rather than a side effect so any errors on the
  // initial mount are caught
  setOnError(tryResetStore);

  const getCanLift = useCallback(
    (id: DraggableId) => canStartDrag(getStore(lazyStoreRef).getState(), id),
    [],
  );

  const getIsMovementAllowed = useCallback(
    () => isMovementAllowed(getStore(lazyStoreRef).getState()),
    [],
  );

  const appContext: AppContextValue = useMemo(
    () => ({
      marshal: dimensionMarshal,
      contextId,
      canLift: getCanLift,
      isMovementAllowed: getIsMovementAllowed,
    }),
    [contextId, dimensionMarshal, getCanLift, getIsMovementAllowed],
  );

  useSensorMarshal(contextId, store);

  // Clean store when unmounting
  useEffect(() => {
    return tryResetStore;
  }, [tryResetStore]);

  return (
    <AppContext.Provider value={appContext}>
      <Provider context={StoreContext} store={store}>
        {props.children}
      </Provider>
    </AppContext.Provider>
  );
}
