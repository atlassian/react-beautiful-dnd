// @flow
import React, { Component, Fragment, type Node } from 'react';
import { type Position, type BoxModel } from 'css-box-model';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import invariant from 'tiny-invariant';
import { isEqual } from '../../state/position';
import type {
  DraggableDimension,
  ItemPositions,
  DroppableId,
  AutoScrollMode,
  TypeId,
} from '../../types';
import DraggableDimensionPublisher from '../draggable-dimension-publisher/';
import Moveable from '../moveable/';
import DragHandle from '../drag-handle';
import getViewport from '../window/get-viewport';
import type {
  DragHandleProps,
  Callbacks as DragHandleCallbacks,
} from '../drag-handle/drag-handle-types';
import getBorderBoxCenterPosition from '../get-border-box-center-position';
import Placeholder from '../placeholder';
import { droppableIdKey, styleContextKey, droppableTypeKey } from '../context-keys';
import * as timings from '../../debug/timings';
import type {
  Props,
  Provided,
  StateSnapshot,
  DraggingStyle,
  NotDraggingStyle,
  DraggableStyle,
  ZIndexOptions,
} from './draggable-types';
import getWindowScroll from '../window/get-window-scroll';
import throwIfRefIsInvalid from '../throw-if-invalid-inner-ref';
import type { Speed } from '../moveable/moveable-types';

export const zIndexOptions: ZIndexOptions = {
  dragging: 5000,
  dropAnimating: 4500,
};

const origin: Position = { x: 0, y: 0 };

const getTranslate = (offset: Position): ?string => {
  if (isEqual(offset, origin)) {
    return null;
  }
  return `translate(${offset.x}px, ${offset.y}px)`;
};

export default class Draggable extends Component<Props> {
  /* eslint-disable react/sort-comp */
  callbacks: DragHandleCallbacks
  styleContext: string
  ref: ?HTMLElement = null

  // Need to declare contextTypes without flow
  // https://github.com/brigand/babel-plugin-flow-react-proptypes/issues/22
  static contextTypes = {
    [droppableIdKey]: PropTypes.string.isRequired,
    [droppableTypeKey]: PropTypes.string.isRequired,
    [styleContextKey]: PropTypes.string.isRequired,
  }

  constructor(props: Props, context: Object) {
    super(props, context);

    const callbacks: DragHandleCallbacks = {
      onLift: this.onLift,
      onMove: this.onMove,
      onDrop: this.onDrop,
      onCancel: this.onCancel,
      onMoveUp: this.onMoveUp,
      onMoveDown: this.onMoveDown,
      onMoveRight: this.onMoveRight,
      onMoveLeft: this.onMoveLeft,
      onWindowScroll: this.onWindowScroll,
    };

    this.callbacks = callbacks;
    this.styleContext = context[styleContextKey];
  }

  componentDidMount() {
    throwIfRefIsInvalid(this.ref);
  }

  componentWillUnmount() {
    // releasing reference to ref for cleanup
    this.ref = null;
  }

  // This should already be handled gracefully in DragHandle.
  // Just being extra clear here
  throwIfCannotDrag() {
    invariant(!this.props.isDragDisabled,
      'Draggable: cannot drag as dragging is not enabled'
    );
  }

    onMoveEnd = () => {
      if (this.props.isDropAnimating) {
        this.props.dropAnimationFinished();
      }
    }

  onLift = (options: {clientSelection: Position, autoScrollMode: AutoScrollMode}) => {
    timings.start('LIFT');
    this.throwIfCannotDrag();
    const { clientSelection, autoScrollMode } = options;
    const { lift, draggableId } = this.props;
    const ref: ?HTMLElement = this.ref;
    throwIfRefIsInvalid(ref);
    invariant(ref);

    const client: ItemPositions = {
      selection: clientSelection,
      borderBoxCenter: getBorderBoxCenterPosition(ref),
      offset: origin,
    };

    lift({
      id: draggableId,
      client,
      autoScrollMode,
      viewport: getViewport(),
    });
    timings.finish('LIFT');
  }

  onMove = (clientSelection: Position) => {
    this.throwIfCannotDrag();

    const { dimension, move } = this.props;

    // dimensions not provided yet
    if (!dimension) {
      return;
    }

    move({ client: clientSelection, shouldAnimate: false });
  }

  onMoveUp = () => {
    this.throwIfCannotDrag();
    this.props.moveUp();
  }

  onMoveDown = () => {
    this.throwIfCannotDrag();
    this.props.moveDown();
  }

  onMoveRight = () => {
    this.throwIfCannotDrag();
    this.props.moveRight();
  }

  onMoveLeft = () => {
    this.throwIfCannotDrag();
    this.props.moveLeft();
  }

  onWindowScroll = () => {
    this.throwIfCannotDrag();
    this.props.moveByWindowScroll({ scroll: getWindowScroll() });
  }

  onDrop = () => {
    this.throwIfCannotDrag();
    this.props.drop({ reason: 'DROP' });
  }

  onCancel = () => {
    // Not checking if drag is enabled.
    // Cancel is an escape mechanism
    this.props.drop({ reason: 'CANCEL' });
  }

  // React calls ref callback twice for every render
  // https://github.com/facebook/react/pull/8333/files
  setRef = ((ref: ?HTMLElement) => {
    if (ref === null) {
      return;
    }

    if (ref === this.ref) {
      return;
    }

    // At this point the ref has been changed or initially populated

    this.ref = ref;
    throwIfRefIsInvalid(ref);
  })

  getDraggableRef = (): ?HTMLElement => this.ref;

  getDraggingStyle = memoizeOne(
    (
      change: Position,
      dimension: DraggableDimension,
      isDropAnimating: boolean,
    ): DraggingStyle => {
      const box: BoxModel = dimension.client;
      const style: DraggingStyle = {
        // ## Placement
        position: 'fixed',
        // As we are applying the margins we need to align to the start of the marginBox
        top: box.marginBox.top,
        left: box.marginBox.left,

        // ## Sizing
        // Locking these down as pulling the node out of the DOM could cause it to change size
        boxSizing: 'border-box',
        width: box.borderBox.width,
        height: box.borderBox.height,

        // ## Movement
        // Opting out of the standard css transition for the dragging item
        transition: 'none',
        // Layering
        zIndex: isDropAnimating ? zIndexOptions.dropAnimating : zIndexOptions.dragging,
        // Moving in response to user input
        transform: getTranslate(change),

        // ## Performance
        pointerEvents: 'none',
      };
      return style;
    }
  )

  getNotDraggingStyle = memoizeOne(
    (current: Position, shouldAnimateDisplacement: boolean): NotDraggingStyle => {
      const style: NotDraggingStyle = {
        transform: getTranslate(current),
        // use the global animation for animation - or opt out of it
        transition: shouldAnimateDisplacement ? null : 'none',
        // transition: css.outOfTheWay,
      };
      return style;
    }
  )

  getProvided = memoizeOne(
    (
      change: Position,
      isDragging: boolean,
      isDropAnimating: boolean,
      shouldAnimateDisplacement: boolean,
      dimension: ?DraggableDimension,
      dragHandleProps: ?DragHandleProps,
    ): Provided => {
      const useDraggingStyle: boolean = isDragging || isDropAnimating;

      const draggableStyle: DraggableStyle = (() => {
        if (!useDraggingStyle) {
          return this.getNotDraggingStyle(change, shouldAnimateDisplacement);
        }

        invariant(dimension, 'draggable dimension required for dragging');

        // Need to position element in original visual position. To do this
        // we position it without
        return this.getDraggingStyle(change, dimension, isDropAnimating);
      })();

      const provided: Provided = {
        innerRef: this.setRef,
        draggableProps: {
          'data-react-beautiful-dnd-draggable': this.styleContext,
          style: draggableStyle,
        },
        dragHandleProps,
      };
      return provided;
    }
  )

  getSnapshot = memoizeOne((
    isDragging: boolean,
    isDropAnimating: boolean,
    draggingOver: ?DroppableId,
  ): StateSnapshot => ({
    isDragging: (isDragging || isDropAnimating),
    draggingOver,
  }))

  getSpeed = (
    isDragging: boolean,
    shouldAnimateDragMovement: boolean,
    isDropAnimating: boolean
  ): Speed => {
    if (isDropAnimating) {
      return 'STANDARD';
    }

    if (isDragging && shouldAnimateDragMovement) {
      return 'FAST';
    }

    // if dragging: no animation
    // if not dragging: animation done with CSS
    return 'INSTANT';
  }

  renderChildren = (change: Position, dragHandleProps: ?DragHandleProps): ?Node => {
    const {
      isDragging,
      isDropAnimating,
      dimension,
      draggingOver,
      shouldAnimateDisplacement,
      children,
    } = this.props;

    const child: ?Node = children(
      this.getProvided(
        change,
        isDragging,
        isDropAnimating,
        shouldAnimateDisplacement,
        dimension,
        dragHandleProps,
      ),
      this.getSnapshot(
        isDragging,
        isDropAnimating,
        draggingOver,
      )
    );

    const isDraggingOrDropping: boolean = (isDragging || isDropAnimating);

    const placeholder: ?Node = (() => {
      if (!isDraggingOrDropping) {
        return null;
      }

      invariant(dimension, 'Draggable: Dimension is required for dragging');

      return <Placeholder placeholder={dimension.placeholder} />;
    })();

    return (
      <Fragment>
        {child}
        {placeholder}
      </Fragment>
    );
  }

  render() {
    const {
      draggableId,
      index,
      offset,
      isDragging,
      isDropAnimating,
      isDragDisabled,
      shouldAnimateDragMovement,
      disableInteractiveElementBlocking,
    } = this.props;
    const droppableId: DroppableId = this.context[droppableIdKey];
    const type: TypeId = this.context[droppableTypeKey];

    const speed = this.getSpeed(
      isDragging,
      shouldAnimateDragMovement,
      isDropAnimating
    );

    return (
      <DraggableDimensionPublisher
        key={draggableId}
        draggableId={draggableId}
        droppableId={droppableId}
        type={type}
        index={index}
        getDraggableRef={this.getDraggableRef}
      >
        <Moveable
          speed={speed}
          destination={offset}
          onMoveEnd={this.onMoveEnd}
        >
          {(change: Position) => (
            <DragHandle
              draggableId={draggableId}
              isDragging={isDragging}
              isDropAnimating={isDropAnimating}
              isEnabled={!isDragDisabled}
              callbacks={this.callbacks}
              getDraggableRef={this.getDraggableRef}
              // by default we do not allow dragging on interactive elements
              canDragInteractiveElements={disableInteractiveElementBlocking}
            >
              {(dragHandleProps: ?DragHandleProps) =>
                this.renderChildren(change, dragHandleProps)
              }
            </DragHandle>
          )}
        </Moveable>
      </DraggableDimensionPublisher>
    );
  }
}
