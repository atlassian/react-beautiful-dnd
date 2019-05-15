// @flow
import invariant from 'tiny-invariant';
import ReactDOM from 'react-dom';
import { useMemo, useCallback } from 'use-memo-one';
import React, { useRef, useContext, type Node } from 'react';
import type { Props, Provided, DraggingFromThisWith } from './droppable-types';
import useDroppableDimensionPublisher from '../use-droppable-dimension-publisher';
import Placeholder from '../placeholder';
import AppContext, { type AppContextValue } from '../context/app-context';
import DroppableContext, {
  type DroppableContextValue,
} from '../context/droppable-context';
// import useAnimateInOut from '../use-animate-in-out/use-animate-in-out';
import getMaxWindowScroll from '../window/get-max-window-scroll';
import useValidation from './use-validation';
import Draggable from '../draggable';
import type {
  StateSnapshot as DraggableStateSnapshot,
  Provided as DraggableProvided,
} from '../draggable/draggable-types';
import AnimateInOut, {
  type AnimateProvided,
} from '../animate-in-out/animate-in-out';

export default function Droppable(props: Props) {
  const appContext: ?AppContextValue = useContext<?AppContextValue>(AppContext);
  invariant(appContext, 'Could not find app context');
  const { contextId, isMovementAllowed } = appContext;
  const droppableRef = useRef<?HTMLElement>(null);
  const placeholderRef = useRef<?HTMLElement>(null);

  // Note: Running validation at the end as it uses some placeholder things

  const {
    // own props
    children,
    droppableId,
    type,
    direction,
    ignoreContainerClipping,
    isDropDisabled,
    isCombineEnabled,
    // map props
    snapshot,
    // dispatch props
    updateViewportMaxScroll,

    // clone (ownProps)
    whenDraggingClone,
    getPortalForClone,
  } = props;

  const getDroppableRef = useCallback(
    (): ?HTMLElement => droppableRef.current,
    [],
  );
  const getPlaceholderRef = useCallback(
    (): ?HTMLElement => placeholderRef.current,
    [],
  );
  const setDroppableRef = useCallback((value: ?HTMLElement) => {
    droppableRef.current = value;
  }, []);
  const setPlaceholderRef = useCallback((value: ?HTMLElement) => {
    placeholderRef.current = value;
  }, []);

  const onPlaceholderTransitionEnd = useCallback(() => {
    // A placeholder change can impact the window's max scroll
    if (isMovementAllowed()) {
      updateViewportMaxScroll({ maxScroll: getMaxWindowScroll() });
    }
  }, [isMovementAllowed, updateViewportMaxScroll]);

  useDroppableDimensionPublisher({
    droppableId,
    type,
    direction,
    isDropDisabled,
    isCombineEnabled,
    ignoreContainerClipping,
    getDroppableRef,
    getPlaceholderRef,
  });

  const placeholder: Node = (
    <AnimateInOut
      on={props.placeholder}
      shouldAnimate={props.shouldAnimatePlaceholder}
    >
      {({ onClose, data, animate }: AnimateProvided) => (
        <Placeholder
          placeholder={(data: any)}
          onClose={onClose}
          innerRef={setPlaceholderRef}
          animate={animate}
          contextId={contextId}
          onTransitionEnd={onPlaceholderTransitionEnd}
        />
      )}
    </AnimateInOut>
  );

  const provided: Provided = useMemo(
    (): Provided => ({
      innerRef: setDroppableRef,
      placeholder,
      droppableProps: {
        'data-rbd-droppable-context-id': contextId,
      },
    }),
    [contextId, placeholder, setDroppableRef],
  );

  const usingCloneWhenDragging: boolean = Boolean(whenDraggingClone);

  const droppableContext: ?DroppableContextValue = useMemo(
    () => ({
      droppableId,
      type,
      usingCloneWhenDragging,
    }),
    [droppableId, type, usingCloneWhenDragging],
  );

  useValidation({
    props,
    getDroppableRef: () => droppableRef.current,
    getPlaceholderRef: () => placeholderRef.current,
  });

  function getClone(): ?Node {
    if (!whenDraggingClone) {
      return null;
    }
    const draggingFromThisWith: ?DraggingFromThisWith =
      snapshot.draggingFromThisWith;
    if (!draggingFromThisWith) {
      return null;
    }
    const { id, source } = draggingFromThisWith;
    console.log('source', source);

    const item: Node = (
      <Draggable draggableId={id} index={source.index} isClone>
        {(
          draggableProvided: DraggableProvided,
          draggableSnapshot: DraggableStateSnapshot,
        ) => whenDraggingClone(draggableProvided, draggableSnapshot, source)}
      </Draggable>
    );

    return ReactDOM.createPortal(item, props.getContainerForClone());
  }

  return (
    <DroppableContext.Provider value={droppableContext}>
      {children(provided, snapshot)}
      {getClone()}
    </DroppableContext.Provider>
  );
}
