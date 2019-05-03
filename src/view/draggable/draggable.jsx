// @flow
import { useRef } from 'react';
import { type Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import { useMemo, useCallback } from 'use-memo-one';
import getStyle from './get-style';
import useDragHandle from '../use-drag-handle/use-drag-handle';
import type {
  Args as DragHandleArgs,
  Callbacks as DragHandleCallbacks,
  DragHandleProps,
} from '../use-drag-handle/drag-handle-types';
import type { MovementMode } from '../../types';
import useDraggableDimensionPublisher, {
  type Args as DimensionPublisherArgs,
} from '../use-draggable-dimension-publisher/use-draggable-dimension-publisher';
import * as timings from '../../debug/timings';
import type { Props, Provided, DraggableStyle } from './draggable-types';
import getWindowScroll from '../window/get-window-scroll';
// import throwIfRefIsInvalid from '../throw-if-invalid-inner-ref';
// import checkOwnProps from './check-own-props';
import AppContext, { type AppContextValue } from '../context/app-context';
import useRequiredContext from '../use-required-context';
import useValidation from './use-validation';

export default function Draggable(props: Props) {
  // reference to DOM node
  const ref = useRef<?HTMLElement>(null);
  const setRef = useCallback((el: ?HTMLElement) => {
    ref.current = el;
  }, []);
  const getRef = useCallback((): ?HTMLElement => ref.current, []);

  // context
  const appContext: AppContextValue = useRequiredContext(AppContext);

  // Validating props and innerRef
  useValidation(props, getRef);

  // props
  const {
    // ownProps
    children,
    draggableId,
    isDragDisabled,
    shouldRespectForcePress,
    disableInteractiveElementBlocking: canDragInteractiveElements,
    index,

    // mapProps
    mapped,

    // dispatchProps
    moveUp: moveUpAction,
    move: moveAction,
    drop: dropAction,
    moveDown: moveDownAction,
    moveRight: moveRightAction,
    moveLeft: moveLeftAction,
    moveByWindowScroll: moveByWindowScrollAction,
    lift: liftAction,
    dropAnimationFinished: dropAnimationFinishedAction,
  } = props;

  // The dimension publisher: talks to the marshal
  const forPublisher: DimensionPublisherArgs = useMemo(
    () => ({
      draggableId,
      index,
      getDraggableRef: getRef,
    }),
    [draggableId, getRef, index],
  );
  useDraggableDimensionPublisher(forPublisher);

  // The Drag handle

  const onLift = useCallback(
    (options: { clientSelection: Position, movementMode: MovementMode }) => {
      timings.start('LIFT');
      const el: ?HTMLElement = ref.current;
      invariant(el);
      invariant(!isDragDisabled, 'Cannot lift a Draggable when it is disabled');
      const { clientSelection, movementMode } = options;

      liftAction({
        id: draggableId,
        clientSelection,
        movementMode,
      });
      timings.finish('LIFT');
    },
    [draggableId, isDragDisabled, liftAction],
  );

  const getShouldRespectForcePress = useCallback(
    () => shouldRespectForcePress,
    [shouldRespectForcePress],
  );

  const callbacks: DragHandleCallbacks = useMemo(
    () => ({
      onLift,
      onMove: (clientSelection: Position) =>
        moveAction({ client: clientSelection }),
      onDrop: () => dropAction({ reason: 'DROP' }),
      onCancel: () => dropAction({ reason: 'CANCEL' }),
      onMoveUp: moveUpAction,
      onMoveDown: moveDownAction,
      onMoveRight: moveRightAction,
      onMoveLeft: moveLeftAction,
      onWindowScroll: () =>
        moveByWindowScrollAction({
          newScroll: getWindowScroll(),
        }),
    }),
    [
      dropAction,
      moveAction,
      moveByWindowScrollAction,
      moveDownAction,
      moveLeftAction,
      moveRightAction,
      moveUpAction,
      onLift,
    ],
  );

  const isDragging: boolean = mapped.type === 'DRAGGING';
  const isDropAnimating: boolean =
    mapped.type === 'DRAGGING' && Boolean(mapped.dropping);

  const dragHandleArgs: DragHandleArgs = useMemo(
    () => ({
      draggableId,
      isDragging,
      isDropAnimating,
      isEnabled: !isDragDisabled,
      callbacks,
      getDraggableRef: getRef,
      canDragInteractiveElements,
      getShouldRespectForcePress,
    }),
    [
      callbacks,
      canDragInteractiveElements,
      draggableId,
      getRef,
      getShouldRespectForcePress,
      isDragDisabled,
      isDragging,
      isDropAnimating,
    ],
  );

  const dragHandleProps: ?DragHandleProps = useDragHandle(dragHandleArgs);

  const onMoveEnd = useCallback(
    (event: TransitionEvent) => {
      if (mapped.type !== 'DRAGGING') {
        return;
      }

      if (!mapped.dropping) {
        return;
      }

      // There might be other properties on the element that are
      // being transitioned. We do not want those to end a drop animation!
      if (event.propertyName !== 'transform') {
        return;
      }

      dropAnimationFinishedAction();
    },
    [dropAnimationFinishedAction, mapped],
  );

  const provided: Provided = useMemo(() => {
    const style: DraggableStyle = getStyle(mapped);
    const onTransitionEnd =
      mapped.type === 'DRAGGING' && mapped.dropping ? onMoveEnd : null;

    const result: Provided = {
      innerRef: setRef,
      draggableProps: {
        'data-rbd-draggable-context-id': appContext.contextId,
        'data-rbd-draggable-id': draggableId,
        'data-rbd-draggable-options': JSON.stringify({
          canDragInteractiveElements,
          shouldRespectForcePress,
        }),
        style,
        onTransitionEnd,
      },
      dragHandleProps,
    };

    return result;
  }, [
    appContext.contextId,
    canDragInteractiveElements,
    dragHandleProps,
    draggableId,
    mapped,
    onMoveEnd,
    setRef,
    shouldRespectForcePress,
  ]);

  return children(provided, mapped.snapshot);
}
