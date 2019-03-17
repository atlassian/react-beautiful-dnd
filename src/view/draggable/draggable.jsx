// @flow
import React, {
  useMemo,
  useRef,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { type Position, type BoxModel } from 'css-box-model';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import invariant from 'tiny-invariant';
import getStyle from './get-style';
import type {
  DraggableDimension,
  DroppableId,
  MovementMode,
  TypeId,
} from '../../types';
import DraggableDimensionPublisher from '../draggable-dimension-publisher';
import DragHandle from '../drag-handle';
import type {
  DragHandleProps,
  Callbacks as DragHandleCallbacks,
} from '../drag-handle/drag-handle-types';
import { droppableIdKey, styleKey, droppableTypeKey } from '../context-keys';
import * as timings from '../../debug/timings';
import type {
  Props,
  Provided,
  StateSnapshot,
  DraggingStyle,
  NotDraggingStyle,
  ZIndexOptions,
  DropAnimation,
  SecondaryMapProps,
  DraggingMapProps,
  ChildrenFn,
  DraggableStyle,
} from './draggable-types';
import getWindowScroll from '../window/get-window-scroll';
import throwIfRefIsInvalid from '../throw-if-invalid-inner-ref';
import checkOwnProps from './check-own-props';
import AppContext, { type AppContextValue } from '../context/app-context';
import DroppableContext, {
  type DroppableContextValue,
} from '../context/droppable-context';
import useRequiredContext from '../use-required-context';

export default function Draggable(props: Props) {
  // instance members
  const ref = useRef<?HTMLElement>(null);
  const setRef = useCallback((el: ?HTMLElement) => {
    ref.current = el;
  }, []);

  // context
  const appContext: AppContextValue = useRequiredContext(AppContext);
  const droppableContext: DroppableContextValue = useRequiredContext(
    DroppableContext,
  );

  // props
  const {
    // ownProps
    children,
    draggableId,
    isDragDisabled,

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
  const dragHandleProps: DragHandleProps = useDragHandle(callbacks);

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

export class Draggable extends React.Component<Props> {
  /* eslint-disable react/sort-comp */
  callbacks: DragHandleCallbacks;
  styleContext: string;
  ref: ?HTMLElement = null;

  // Need to declare contextTypes without flow
  // https://github.com/brigand/babel-plugin-flow-react-proptypes/issues/22
  static contextTypes = {
    [droppableIdKey]: PropTypes.string.isRequired,
    [droppableTypeKey]: PropTypes.string.isRequired,
    [styleKey]: PropTypes.string.isRequired,
  };

  constructor(props: Props, context: Object) {
    super(props, context);

    const callbacks: DragHandleCallbacks = {
      onLift: this.onLift,
      onMove: (clientSelection: Position) =>
        props.move({ client: clientSelection }),
      onDrop: () => props.drop({ reason: 'DROP' }),
      onCancel: () => props.drop({ reason: 'CANCEL' }),
      onMoveUp: props.moveUp,
      onMoveDown: props.moveDown,
      onMoveRight: props.moveRight,
      onMoveLeft: props.moveLeft,
      onWindowScroll: () =>
        props.moveByWindowScroll({
          newScroll: getWindowScroll(),
        }),
    };

    this.callbacks = callbacks;
    this.styleContext = context[styleKey];

    // Only running this check on creation.
    // Could run it on updates, but I don't think that would be needed
    // as it is designed to prevent setup issues
    if (process.env.NODE_ENV !== 'production') {
      checkOwnProps(props);
    }
  }

  componentWillUnmount() {
    // releasing reference to ref for cleanup
    this.ref = null;
  }

  onMoveEnd = (event: TransitionEvent) => {
    const isDropping: boolean = Boolean(
      this.props.dragging && this.props.dragging.dropping,
    );

    if (!isDropping) {
      return;
    }

    // There might be other properties on the element that are
    // being transitioned. We do not want those to end a drop animation!
    if (event.propertyName !== 'transform') {
      return;
    }

    this.props.dropAnimationFinished();
  };

  onLift = (options: {
    clientSelection: Position,
    movementMode: MovementMode,
  }) => {
    timings.start('LIFT');
    const ref: ?HTMLElement = this.ref;
    invariant(ref);
    invariant(
      !this.props.isDragDisabled,
      'Cannot lift a Draggable when it is disabled',
    );
    const { clientSelection, movementMode } = options;
    const { lift, draggableId } = this.props;

    lift({
      id: draggableId,
      clientSelection,
      movementMode,
    });
    timings.finish('LIFT');
  };

  // React can call ref callback twice for every render
  // if using an arrow function
  setRef = (ref: ?HTMLElement) => {
    if (ref === null) {
      return;
    }

    if (ref === this.ref) {
      return;
    }

    // At this point the ref has been changed or initially populated

    this.ref = ref;
    throwIfRefIsInvalid(ref);
  };

  getDraggableRef = (): ?HTMLElement => this.ref;
  getShouldRespectForceTouch = (): boolean =>
    this.props.shouldRespectForceTouch;

  getDraggingStyle = memoizeOne(
    (dragging: DraggingMapProps): DraggingStyle => {
      co;
    },
  );

  getSecondaryStyle = memoizeOne(
    (secondary: SecondaryMapProps): NotDraggingStyle => ({
      transform: transforms.moveTo(secondary.offset),
      // transition style is applied in the head
      transition: secondary.shouldAnimateDisplacement ? null : 'none',
    }),
  );

  getDraggingProvided = memoizeOne(
    (
      dragging: DraggingMapProps,
      dragHandleProps: ?DragHandleProps,
    ): Provided => {
      const style: DraggingStyle = this.getDraggingStyle(dragging);
      const isDropping: boolean = Boolean(dragging.dropping);
      const provided: Provided = {
        innerRef: this.setRef,
        draggableProps: {
          'data-react-beautiful-dnd-draggable': this.styleContext,
          style,
          onTransitionEnd: isDropping ? this.onMoveEnd : null,
        },
        dragHandleProps,
      };
      return provided;
    },
  );

  getSecondaryProvided = memoizeOne(
    (
      secondary: SecondaryMapProps,
      dragHandleProps: ?DragHandleProps,
    ): Provided => {
      const style: NotDraggingStyle = this.getSecondaryStyle(secondary);
      const provided: Provided = {
        innerRef: this.setRef,
        draggableProps: {
          'data-react-beautiful-dnd-draggable': this.styleContext,
          style,
          onTransitionEnd: null,
        },
        dragHandleProps,
      };
      return provided;
    },
  );

  getDraggingSnapshot = memoizeOne(
    (dragging: DraggingMapProps): StateSnapshot => ({
      isDragging: true,
      isDropAnimating: Boolean(dragging.dropping),
      dropAnimation: dragging.dropping,
      mode: dragging.mode,
      draggingOver: dragging.draggingOver,
      combineWith: dragging.combineWith,
      combineTargetFor: null,
    }),
  );

  getSecondarySnapshot = memoizeOne(
    (secondary: SecondaryMapProps): StateSnapshot => ({
      isDragging: false,
      isDropAnimating: false,
      dropAnimation: null,
      mode: null,
      draggingOver: null,
      combineTargetFor: secondary.combineTargetFor,
      combineWith: null,
    }),
  );

  renderChildren = (dragHandleProps: ?DragHandleProps): Node | null => {
    const dragging: ?DraggingMapProps = this.props.dragging;
    const secondary: ?SecondaryMapProps = this.props.secondary;
    const children: ChildrenFn = this.props.children;

    if (dragging) {
      return children(
        this.getDraggingProvided(dragging, dragHandleProps),
        this.getDraggingSnapshot(dragging),
      );
    }

    invariant(
      secondary,
      'If no DraggingMapProps are provided, then SecondaryMapProps are required',
    );

    return children(
      this.getSecondaryProvided(secondary, dragHandleProps),
      this.getSecondarySnapshot(secondary),
    );
  };

  render() {
    const {
      draggableId,
      index,
      dragging,
      isDragDisabled,
      disableInteractiveElementBlocking,
    } = this.props;
    const droppableId: DroppableId = this.context[droppableIdKey];
    const type: TypeId = this.context[droppableTypeKey];
    const isDragging: boolean = Boolean(dragging);
    const isDropAnimating: boolean = Boolean(dragging && dragging.dropping);

    return (
      <DraggableDimensionPublisher
        key={draggableId}
        draggableId={draggableId}
        droppableId={droppableId}
        type={type}
        index={index}
        getDraggableRef={this.getDraggableRef}
      >
        <DragHandle
          draggableId={draggableId}
          isDragging={isDragging}
          isDropAnimating={isDropAnimating}
          isEnabled={!isDragDisabled}
          callbacks={this.callbacks}
          getDraggableRef={this.getDraggableRef}
          getShouldRespectForceTouch={this.getShouldRespectForceTouch}
          // by default we do not allow dragging on interactive elements
          canDragInteractiveElements={disableInteractiveElementBlocking}
        >
          {this.renderChildren}
        </DragHandle>
      </DraggableDimensionPublisher>
    );
  }
}
