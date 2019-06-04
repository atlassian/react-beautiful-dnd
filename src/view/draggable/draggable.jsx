// @flow
import { useRef } from 'react';
import { useMemo, useCallback } from 'use-memo-one';
import getStyle from './get-style';
import useDraggableDimensionPublisher, {
  type Args as DimensionPublisherArgs,
} from '../use-draggable-dimension-publisher/use-draggable-dimension-publisher';
import type {
  Props,
  Provided,
  DraggableStyle,
  DragHandleProps,
} from './draggable-types';
import useValidation from './use-validation';
import { serialize } from '../draggable-options';

function preventHtml5Dnd(event: DragEvent) {
  event.preventDefault();
}

export default function Draggable(props: Props) {
  // reference to DOM node
  const ref = useRef<?HTMLElement>(null);
  const setRef = useCallback((el: ?HTMLElement) => {
    ref.current = el;
  }, []);
  const getRef = useCallback((): ?HTMLElement => ref.current, []);

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
    isClone,
    appContext,
    droppableContext,

    // mapProps
    mapped,

    // dispatchProps
    dropAnimationFinished: dropAnimationFinishedAction,
  } = props;
  const isEnabled: boolean = !isDragDisabled;

  // TODO: is this the right approach?
  // The dimension publisher: talks to the marshal
  // We are violating the rules of hooks here: conditional hooks.
  // In this specific use case it is okay as an item will always either be a clone or not for it's whole lifecycle
  if (!isClone) {
    const forPublisher: DimensionPublisherArgs = useMemo(
      () => ({
        draggableId,
        index,
        getDraggableRef: getRef,
      }),
      [draggableId, getRef, index],
    );
    useDraggableDimensionPublisher(forPublisher);
  }

  const dragHandleProps: ?DragHandleProps = useMemo(
    () =>
      isEnabled
        ? {
            tabIndex: 0,
            'data-rbd-drag-handle-draggable-id': draggableId,
            'data-rbd-drag-handle-context-id': appContext.contextId,
            // English default. Consumers are welcome to add their own start instruction
            'aria-roledescription': 'Draggable item. Press space bar to lift',
            // Opting out of html5 drag and drops
            draggable: false,
            onDragStart: preventHtml5Dnd,
          }
        : null,
    [appContext.contextId, draggableId, isEnabled],
  );

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
        'data-rbd-draggable-options': serialize({
          canDragInteractiveElements,
          shouldRespectForcePress,
          isEnabled,
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
    isEnabled,
    mapped,
    onMoveEnd,
    setRef,
    shouldRespectForcePress,
  ]);

  const isDragging: boolean = mapped.type === 'DRAGGING';

  if (isDragging && droppableContext.usingCloneWhenDragging && !isClone) {
    return null;
  }

  return children(provided, mapped.snapshot);
}
