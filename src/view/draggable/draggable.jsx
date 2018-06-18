// @flow
import React, { Component, Fragment, type Node } from 'react';
import { type Position, type BoxModel } from 'css-box-model';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import invariant from 'tiny-invariant';
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
import { withBoxSpacing, getBoxSizingHeightAndWidth } from '../../state/box';
import type { Speed, Style as MovementStyle } from '../moveable/moveable-types';

export const zIndexOptions: ZIndexOptions = {
  dragging: 5000,
  dropAnimating: 4500,
};

const origin: Position = { x: 0, y: 0 };

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
    if (!this.ref) {
      console.error(`
        Draggable has not been provided with a ref.
        Please use the DraggableProvided > innerRef function
      `);
    }
  }

  componentWillUnmount() {
    // releasing reference to ref for cleanup
    this.ref = null;
  }

  // This should already be handled gracefully in DragHandle.
  // Just being extra clear here
  throwIfCannotDrag() {
    invariant(this.ref, `
      Draggable: cannot drag as no DOM node has been provided
      Please ensure you provide a DOM node using the DraggableProvided > innerRef function
    `);
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

    invariant(ref, 'Cannot lift at this time as there is no ref');

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
  }

  onMove = (clientSelection: Position) => {
    this.throwIfCannotDrag();

    const { dimension, move } = this.props;

    // dimensions not provided yet
    if (!dimension) {
      return;
    }

    timings.start('move');
    move({ client: clientSelection, shouldAnimate: false });
    timings.finish('move');
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
  })

  getDraggableRef = (): ?HTMLElement => this.ref;

  getDraggingStyle = memoizeOne(
    (dimension: DraggableDimension,
      isDropAnimating: boolean,
      movementStyle: MovementStyle): DraggingStyle => {
      const box: BoxModel = dimension.client;

      // const { width, height, top, left } = dimension.client.borderBox;
      // For an explanation of properties see `draggable-types`.
      const { width, height } = getBoxSizingHeightAndWidth(box, dimension.boxSizing);

      const style: DraggingStyle = {
        // ## Sizing
        boxSizing: dimension.boxSizing,
        width,
        height,
        ...withBoxSpacing(box),
        // ## Placement
        // As we are applying the margins we need to align to the start of the marginBox
        top: box.marginBox.top,
        left: box.marginBox.left,
        zIndex: isDropAnimating ? zIndexOptions.dropAnimating : zIndexOptions.dragging,
        transition: 'none',
        transform: movementStyle.transform ? `${movementStyle.transform}` : null,
        position: 'fixed',
        // ## Performance
        pointerEvents: 'none',
      };
      return style;
    }
  )

  getNotDraggingStyle = memoizeOne(
    (movementStyle: MovementStyle, shouldAnimateDisplacement: boolean): NotDraggingStyle => {
      const style: NotDraggingStyle = {
        transform: movementStyle.transform,
        // use the global animation for animation - or opt out of it
        transition: shouldAnimateDisplacement ? null : 'none',
        // transition: css.outOfTheWay,
      };
      return style;
    }
  )

  getProvided = memoizeOne(
    (
      isDragging: boolean,
      isDropAnimating: boolean,
      shouldAnimateDisplacement: boolean,
      dimension: ?DraggableDimension,
      dragHandleProps: ?DragHandleProps,
      movementStyle: MovementStyle,
    ): Provided => {
      const useDraggingStyle: boolean = isDragging || isDropAnimating;

      const draggableStyle: DraggableStyle = (() => {
        if (!useDraggingStyle) {
          return this.getNotDraggingStyle(movementStyle, shouldAnimateDisplacement);
        }

        invariant(dimension, 'draggable dimension required for dragging');

        // Need to position element in original visual position. To do this
        // we position it without
        return this.getDraggingStyle(dimension, isDropAnimating, movementStyle);
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

  getSpeed = memoizeOne(
    (isDragging: boolean, shouldAnimateDragMovement: boolean, isDropAnimating: boolean): Speed => {
      if (isDropAnimating) {
        return 'STANDARD';
      }

      // if dragging and can animate - then move quickly
      if (isDragging && shouldAnimateDragMovement) {
        return 'FAST';
      }

      // Animation taken care of by css
      return 'INSTANT';
    })

  renderChildren = (movementStyle: MovementStyle, dragHandleProps: ?DragHandleProps): ?Node => {
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
        isDragging,
        isDropAnimating,
        shouldAnimateDisplacement,
        dimension,
        dragHandleProps,
        movementStyle,
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

      if (!dimension) {
        console.error('Draggable: Dimension is required for dragging');
        return null;
      }

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
          {(movementStyle: MovementStyle) => (
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
                this.renderChildren(movementStyle, dragHandleProps)
              }
            </DragHandle>
          )}
        </Moveable>
      </DraggableDimensionPublisher>
    );
  }
}
