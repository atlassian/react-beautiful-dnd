// @flow
import React, { useEffect, useRef, type Node } from 'react';
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

type Props = {|
  ...Responders,
  uniqueId: number,
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

export default function App(props: Props) {
  const { uniqueId, setOnError } = props;
  // flow does not support MutableRefObject
  // let storeRef: MutableRefObject<Store>;
  let storeRef;

  useStartupValidation();

  // lazy collection of responders using a ref - update on ever render
  const lastPropsRef = usePrevious<Props>(props);

  const getResponders: () => Responders = useCallback(() => {
    return createResponders(lastPropsRef.current);
  }, [lastPropsRef]);

  const announce: Announce = useAnnouncer(uniqueId);
  const styleMarshal: StyleMarshal = useStyleMarshal(uniqueId);

  const lazyDispatch: Action => void = useCallback(
    (action: Action): void => {
      storeRef.current.dispatch(action);
    },
    // not checking the store ref as it is not set yet
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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

  storeRef = useRef<Store>(store);

  const tryResetStore = useCallback(() => {
    const state: State = storeRef.current.getState();
    if (state.phase !== 'IDLE') {
      store.dispatch(clean({ shouldFlush: true }));
    }
  }, [store, storeRef]);

  // doing this in render rather than a side effect so any errors on the
  // initial mount are caught
  setOnError(tryResetStore);

  const getCanLift = useCallback(
    (id: DraggableId) => canStartDrag(storeRef.current.getState(), id),
    [storeRef],
  );

  const getIsMovementAllowed = useCallback(
    () => isMovementAllowed(storeRef.current.getState()),
    [storeRef],
  );

  const appContext: AppContextValue = useMemo(
    () => ({
      marshal: dimensionMarshal,
      style: styleMarshal.styleContext,
      canLift: getCanLift,
      isMovementAllowed: getIsMovementAllowed,
    }),
    [
      dimensionMarshal,
      getCanLift,
      getIsMovementAllowed,
      styleMarshal.styleContext,
    ],
  );

  // Clean store when unmounting
  useEffect(() => {
    return tryResetStore;
  }, [tryResetStore]);

  return (
    <AppContext.Provider value={appContext}>
      <Provider context={StoreContext} store={storeRef.current}>
        {props.children}
      </Provider>
    </AppContext.Provider>
  );
}
