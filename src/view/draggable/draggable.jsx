// @flow
import { useMemo, useRef, useCallback } from 'react';
import { type Position } from 'css-box-model';
import invariant from 'tiny-invariant';
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
import type {
  Props,
  Provided,
  StateSnapshot,
  DraggableStyle,
} from './draggable-types';
import getWindowScroll from '../window/get-window-scroll';
// import throwIfRefIsInvalid from '../throw-if-invalid-inner-ref';
// import checkOwnProps from './check-own-props';
import AppContext, { type AppContextValue } from '../context/app-context';
import DroppableContext, {
  type DroppableContextValue,
} from '../context/droppable-context';
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
  const droppableContext: DroppableContextValue = useRequiredContext(
    DroppableContext,
  );

  // Validating props and innerRef
  useValidation(props, ref.current);

  // props
  const {
    // ownProps
    children,
    draggableId,
    isDragDisabled,
    shouldRespectForceTouch,
    disableInteractiveElementBlocking: canDragInteractiveElements,
    index,

    // mapProps
    dragging,
    secondary,

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
      droppableId: droppableContext.droppableId,
      type: droppableContext.type,
      index,
      getDraggableRef: getRef,
    }),
    [
      draggableId,
      droppableContext.droppableId,
      droppableContext.type,
      getRef,
      index,
    ],
  );
  useDraggableDimensionPublisher(forPublisher);

  // The Drag handle

  const onLift = useCallback(
    () => (options: {
      clientSelection: Position,
      movementMode: MovementMode,
    }) => {
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

  const getShouldRespectForceTouch = useCallback(
    () => shouldRespectForceTouch,
    [shouldRespectForceTouch],
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

  const isDragging: boolean = Boolean(dragging);
  const isDropAnimating: boolean = Boolean(dragging && dragging.dropping);

  const dragHandleArgs: DragHandleArgs = useMemo(
    () => ({
      draggableId,
      isDragging,
      isDropAnimating,
      isEnabled: !isDragDisabled,
      callbacks,
      getDraggableRef: getRef,
      canDragInteractiveElements,
      getShouldRespectForceTouch,
    }),
    [
      callbacks,
      canDragInteractiveElements,
      draggableId,
      getRef,
      getShouldRespectForceTouch,
      isDragDisabled,
      isDragging,
      isDropAnimating,
    ],
  );

  const dragHandleProps: DragHandleProps = useDragHandle(dragHandleArgs);

  const onMoveEnd = useCallback(
    (event: TransitionEvent) => {
      const isDropping: boolean = Boolean(dragging && dragging.dropping);

      if (!isDropping) {
        return;
      }

      // There might be other properties on the element that are
      // being transitioned. We do not want those to end a drop animation!
      if (event.propertyName !== 'transform') {
        return;
      }

      dropAnimationFinishedAction();
    },
    [dragging, dropAnimationFinishedAction],
  );

  const provided: Provided = useMemo(() => {
    const style: DraggableStyle = getStyle(dragging, secondary);
    const onTransitionEnd = dragging && dragging.dropping ? onMoveEnd : null;

    const result: Provided = {
      innerRef: setRef,
      draggableProps: {
        'data-react-beautiful-dnd-draggable': appContext.style,
        style,
        onTransitionEnd,
      },
      dragHandleProps,
    };

    return result;
  }, [
    appContext.style,
    dragHandleProps,
    dragging,
    onMoveEnd,
    secondary,
    setRef,
  ]);

  // TODO: this could be done in the connected component
  const snapshot: StateSnapshot = useMemo(() => {
    if (dragging) {
      return {
        isDragging: true,
        isDropAnimating: Boolean(dragging.dropping),
        dropAnimation: dragging.dropping,
        mode: dragging.mode,
        draggingOver: dragging.draggingOver,
        combineWith: dragging.combineWith,
        combineTargetFor: null,
      };
    }
    invariant(secondary, 'Expected dragging or secondary snapshot');
    return {
      isDragging: false,
      isDropAnimating: false,
      dropAnimation: null,
      mode: null,
      draggingOver: null,
      combineTargetFor: secondary.combineTargetFor,
      combineWith: null,
    };
  }, [dragging, secondary]);

  return children(provided, snapshot);
}
