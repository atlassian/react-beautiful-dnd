// @flow
import { useRef } from 'react';
import { useMemo, useCallback } from 'use-memo-one';
import type { DraggableDescriptor } from '../../types';
import getStyle from './get-style';
import useDraggablePublisher, {
  type Args as PublisherArgs,
} from '../use-draggable-publisher/use-draggable-publisher';
import AppContext from '../context/app-context';
import DroppableContext from '../context/droppable-context';
import type {
  Props,
  Provided,
  DraggableStyle,
  DragHandleProps,
} from './draggable-types';
import { useValidation, useClonePropValidation } from './use-validation';
import useRequiredContext from '../use-required-context';

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

  // context
  const { contextId, liftInstructionId, registry } = useRequiredContext(
    AppContext,
  );
  const { type, droppableId } = useRequiredContext(DroppableContext);

  const descriptor: DraggableDescriptor = useMemo(
    () => ({
      id: props.draggableId,
      index: props.index,
      type,
      droppableId,
    }),
    [props.draggableId, props.index, type, droppableId],
  );

  // props
  const {
    // ownProps
    children,
    draggableId,
    isEnabled,
    shouldRespectForcePress,
    canDragInteractiveElements,
    isClone,

    // mapProps
    mapped,

    // dispatchProps
    dropAnimationFinished: dropAnimationFinishedAction,
  } = props;

  // Validating props and innerRef
  useValidation(props, contextId, getRef);

  // Clones do not speak to the dimension marshal
  // We are violating the rules of hooks here: conditional hooks.
  // In this specific use case it is okay as an item will always either be a
  // clone or not for it's whole lifecycle
  /* eslint-disable react-hooks/rules-of-hooks */

  // Being super sure that isClone is not changing during a draggable lifecycle
  useClonePropValidation(isClone);
  if (!isClone) {
    const forPublisher: PublisherArgs = useMemo(
      () => ({
        descriptor,
        registry,
        getDraggableRef: getRef,
        canDragInteractiveElements,
        shouldRespectForcePress,
        isEnabled,
      }),
      [
        descriptor,
        registry,
        getRef,
        canDragInteractiveElements,
        shouldRespectForcePress,
        isEnabled,
      ],
    );
    useDraggablePublisher(forPublisher);
  }
  /* eslint-enable react-hooks/rules-of-hooks */

  const dragHandleProps: ?DragHandleProps = useMemo(
    () =>
      isEnabled
        ? {
            tabIndex: 0,
            'data-rbd-drag-handle-draggable-id': draggableId,
            'data-rbd-drag-handle-context-id': contextId,
            'aria-labelledby': liftInstructionId,
            // Opting out of html5 drag and drops
            draggable: false,
            onDragStart: preventHtml5Dnd,
          }
        : null,
    [contextId, draggableId, isEnabled, liftInstructionId],
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
        'data-rbd-draggable-context-id': contextId,
        'data-rbd-draggable-id': draggableId,
        style,
        onTransitionEnd,
      },
      dragHandleProps,
    };

    return result;
  }, [contextId, dragHandleProps, draggableId, mapped, onMoveEnd, setRef]);

  return children(provided, mapped.snapshot, descriptor);
}
