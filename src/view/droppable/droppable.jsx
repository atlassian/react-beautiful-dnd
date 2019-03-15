// @flow
import invariant from 'tiny-invariant';
import React, {
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useContext,
  type Node,
} from 'react';
import type { Props, Provided, StateSnapshot } from './droppable-types';
import type { DroppableId, TypeId } from '../../types';
import Placeholder from '../placeholder';
import throwIfRefIsInvalid from '../throw-if-invalid-inner-ref';
import AppContext, { type AppContextValue } from '../context/app-context';
import { warning } from '../../dev-warning';
import DroppableContext, {
  type DroppableContextValue,
} from '../context/droppable-context';
import useAnimateInOut, {
  type AnimateProvided,
} from '../use-animate-in-out/use-animate-in-out';
import getMaxWindowScroll from '../window/get-max-window-scroll';
import { checkOwnProps, checkPlaceholder, checkProvidedRef } from './check';

type Context = {
  [string]: DroppableId | TypeId,
};

export default function Droppable(props: Props) {
  const appContext: ?AppContextValue = useContext<?AppContextValue>(AppContext);
  invariant(appContext, 'Could not find app context');
  const { style: styleContext, isMovementAllowed } = appContext;
  const droppableRef = useRef<?HTMLElement>(null);
  const placeholderRef = useRef<?HTMLElement>(null);

  // validating setup
  useEffect(() => {
    checkOwnProps(props);
    checkPlaceholder(props, placeholderRef.current);
    checkProvidedRef(droppableRef.current);
  });

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
    isDraggingOver,
    draggingOverWith,
    draggingFromThisWith,
    // dispatch props
    updateViewportMaxScroll,
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
    ignoreContainerClipping,
    isDropDisabled,
    isCombineEnabled,
    getDroppableRef,
    getPlaceholderRef,
  });

  const instruction: ?AnimateProvided = useAnimateInOut({
    on: props.placeholder,
    shouldAnimate: props.shouldAnimatePlaceholder,
  });

  const placeholder: Node | null = instruction ? (
    <Placeholder
      placeholder={instruction.data}
      onClose={instruction.onClose}
      innerRef={setPlaceholderRef}
      animate={instruction.animate}
      onTransitionEnd={onPlaceholderTransitionEnd}
    />
  ) : null;

  const provided: Provided = useMemo(
    (): Provided => ({
      innerRef: setDroppableRef,
      placeholder,
      droppableProps: {
        'data-react-beautiful-dnd-droppable': styleContext,
      },
    }),
    [placeholder, setDroppableRef, styleContext],
  );

  const snapshot: StateSnapshot = useMemo(
    () => ({
      isDraggingOver,
      draggingOverWith,
      draggingFromThisWith,
    }),
    [draggingFromThisWith, draggingOverWith, isDraggingOver],
  );

  const droppableContext: ?DroppableContextValue = useMemo(
    () => ({
      droppableId,
      type,
    }),
    [droppableId, type],
  );

  return (
    <DroppableContext.Provider value={droppableContext}>
      {children(provided, snapshot)}
    </DroppableContext.Provider>
  );
}
