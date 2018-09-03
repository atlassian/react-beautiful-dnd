// @flow
import React, { Component, Fragment, type Node } from 'react';
import { type Position, type BoxModel } from 'css-box-model';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import invariant from 'tiny-invariant';
import { isEqual, origin } from '../../state/position';
import { transitions } from '../animation';
import type {
  DraggableDimension,
  ClientPositions,
  DraggableId,
  DroppableId,
  AutoScrollMode,
  TypeId,
} from '../../types';
import DraggableDimensionPublisher from '../draggable-dimension-publisher';
import DragHandle from '../drag-handle';
import getViewport from '../window/get-viewport';
import type {
  DragHandleProps,
  Callbacks as DragHandleCallbacks,
} from '../drag-handle/drag-handle-types';
import getBorderBoxCenterPosition from '../get-border-box-center-position';
import Placeholder from '../placeholder';
import {
  droppableIdKey,
  styleContextKey,
  droppableTypeKey,
} from '../context-keys';
import * as timings from '../../debug/timings';
import type {
  Props,
  Provided,
  StateSnapshot,
  DraggingStyle,
  NotDraggingStyle,
  DraggableStyle,
  ZIndexOptions,
  DroppingState,
} from './draggable-types';
import getWindowScroll from '../window/get-window-scroll';
import throwIfRefIsInvalid from '../throw-if-invalid-inner-ref';

export const zIndexOptions: ZIndexOptions = {
  dragging: 5000,
  dropAnimating: 4500,
};

export const getOpacity = (
  isDropAnimating: boolean,
  isGroupingWith: boolean,
): ?number => {
  if (!isGroupingWith) {
    return null;
  }

  if (isDropAnimating) {
    return 0;
  }

  return 0.7;
};

type GetTransformArgs = {|
  offset: Position,
  isGroupingWith: boolean,
  isGroupingOver: boolean,
  isDropping: boolean,
|};

export const getTransform = (() => {
  const getScale = (isGroupingWith, isGroupingOver, isDropping): ?string => {
    if (isGroupingWith && isDropping) {
      return `scale(0.75)`;
    }
    if (isGroupingOver) {
      return `scale(1.04)`;
    }
    return null;
  };

  return ({
    offset,
    isGroupingWith,
    isGroupingOver,
    isDropping,
  }: GetTransformArgs): ?string => {
    const translate: ?string = !isEqual(offset, origin)
      ? `translate(${offset.x}px, ${offset.y}px)`
      : null;
    const scale: ?string = getScale(isGroupingWith, isGroupingOver, isDropping);

    if (translate && scale) {
      return `${translate} ${scale}`;
    }

    return translate || scale || null;
  };
})();

const getDraggingTransition = (
  shouldAnimateDragMovement: boolean,
  dropping: ?DroppingState,
): string => {
  if (dropping) {
    return transitions.isDropping(dropping.duration);
  }
  if (shouldAnimateDragMovement) {
    return transitions.snapTo;
  }
  return transitions.opacity;
};

export default class Draggable extends Component<Props> {
  /* eslint-disable react/sort-comp */
  callbacks: DragHandleCallbacks;
  styleContext: string;
  ref: ?HTMLElement = null;

  // Need to declare contextTypes without flow
  // https://github.com/brigand/babel-plugin-flow-react-proptypes/issues/22
  static contextTypes = {
    [droppableIdKey]: PropTypes.string.isRequired,
    [droppableTypeKey]: PropTypes.string.isRequired,
    [styleContextKey]: PropTypes.string.isRequired,
  };

  constructor(props: Props, context: Object) {
    super(props, context);

    const callbacks: DragHandleCallbacks = {
      onLift: this.onLift,
      onMove: (clientSelection: Position) =>
        props.move({ client: clientSelection, shouldAnimate: false }),
      onDrop: () => props.drop({ reason: 'DROP' }),
      onCancel: () => props.drop({ reason: 'CANCEL' }),
      onMoveUp: props.moveUp,
      onMoveDown: props.moveDown,
      onMoveRight: props.moveRight,
      onMoveLeft: props.moveLeft,
      onWindowScroll: () =>
        props.moveByWindowScroll({ scroll: getWindowScroll() }),
    };

    this.callbacks = callbacks;
    this.styleContext = context[styleContextKey];
  }

  componentWillUnmount() {
    // releasing reference to ref for cleanup
    this.ref = null;
  }

  onMoveEnd = () => {
    if (this.props.dropping) {
      this.props.dropAnimationFinished();
    }
  };

  onLift = (options: {
    clientSelection: Position,
    autoScrollMode: AutoScrollMode,
  }) => {
    timings.start('LIFT');
    const ref: ?HTMLElement = this.ref;
    invariant(ref);
    invariant(
      !this.props.isDragDisabled,
      'Cannot lift a Draggable when it is disabled',
    );
    const { clientSelection, autoScrollMode } = options;
    const { lift, draggableId } = this.props;

    const client: ClientPositions = {
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
  };

  // React calls ref callback twice for every render
  // https://github.com/facebook/react/pull/8333/files
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

  getDraggingStyle = memoizeOne(
    (
      change: Position,
      dimension: ?DraggableDimension,
      shouldAnimateDragMovement: boolean,
      isGroupingWith: boolean,
      dropping: ?DroppingState,
    ): DraggingStyle => {
      invariant(dimension, 'Cannot get draggable style without a dimension');
      const box: BoxModel = dimension.client;
      const transition: string = getDraggingTransition(
        shouldAnimateDragMovement,
        dropping,
      );
      const isDropAnimating: boolean = Boolean(dropping);
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
        transition,
        // Layering
        zIndex: isDropAnimating
          ? zIndexOptions.dropAnimating
          : zIndexOptions.dragging,
        // Moving in response to user input
        transform: getTransform({
          offset: change,
          isGroupingWith,
          isGroupingOver: false,
          isDropping: isDropAnimating,
        }),
        opacity: getOpacity(isDropAnimating, isGroupingWith),
        // ## Performance
        pointerEvents: 'none',
      };
      return style;
    },
  );

  getNotDraggingStyle = memoizeOne(
    (
      current: Position,
      shouldAnimateDisplacement: boolean,
      isGroupingOver: boolean,
    ): NotDraggingStyle => {
      const style: NotDraggingStyle = {
        transform: getTransform({
          offset: current,
          isGroupingWith: false,
          isGroupingOver,
          isDropping: false,
        }),
        // transition style is applied in the head
        transition: shouldAnimateDisplacement ? null : 'none',
      };
      return style;
    },
  );

  getProvided = memoizeOne(
    (
      change: Position,
      isDragging: boolean,
      isGroupingWith: boolean,
      isGroupingOver: boolean,
      dropping: ?DroppingState,
      shouldAnimateDisplacement: boolean,
      shouldAnimateDragMovement: boolean,
      dimension: ?DraggableDimension,
      dragHandleProps: ?DragHandleProps,
    ): Provided => {
      const isDraggingOrDropping: boolean = isDragging || Boolean(dropping);

      const draggableStyle: DraggableStyle = isDraggingOrDropping
        ? this.getDraggingStyle(
            change,
            dimension,
            shouldAnimateDragMovement,
            isGroupingWith,
            dropping,
          )
        : this.getNotDraggingStyle(
            change,
            shouldAnimateDisplacement,
            isGroupingOver,
          );

      const provided: Provided = {
        innerRef: this.setRef,
        draggableProps: {
          'data-react-beautiful-dnd-draggable': this.styleContext,
          style: draggableStyle,
          onTransitionEnd: dropping ? this.onMoveEnd : null,
        },
        dragHandleProps,
      };
      return provided;
    },
  );

  getSnapshot = memoizeOne(
    (
      isDraggingOrDropping: boolean,
      dropping: ?DroppingState,
      draggingOver: ?DroppableId,
      groupingWith: ?DraggableId,
      groupedOverBy: ?DraggableId,
    ): StateSnapshot => ({
      isDragging: isDraggingOrDropping,
      dropping,
      draggingOver,
      groupingWith,
      groupedOverBy,
    }),
  );

  renderChildren = (
    change: Position,
    dragHandleProps: ?DragHandleProps,
  ): ?Node => {
    const {
      isDragging,
      dropping,
      draggingOver,
      groupingWith,
      groupedOverBy,
      dimension,
      shouldAnimateDisplacement,
      shouldAnimateDragMovement,
      children,
    } = this.props;

    const isDraggingOrDropping: boolean = isDragging || Boolean(dropping);
    const child: ?Node = children(
      this.getProvided(
        change,
        isDragging,
        Boolean(groupingWith),
        Boolean(groupedOverBy),
        dropping,
        shouldAnimateDisplacement,
        shouldAnimateDragMovement,
        dimension,
        dragHandleProps,
      ),
      this.getSnapshot(
        isDraggingOrDropping,
        dropping,
        draggingOver,
        groupingWith,
        groupedOverBy,
      ),
    );

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
  };

  render() {
    const {
      draggableId,
      index,
      offset,
      isDragging,
      dropping,
      isDragDisabled,
      groupedOverBy,
      // TODO: shouldAnimateDragMovement
      disableInteractiveElementBlocking,
    } = this.props;
    const droppableId: DroppableId = this.context[droppableIdKey];
    const type: TypeId = this.context[droppableTypeKey];

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
          isDropAnimating={Boolean(dropping)}
          isEnabled={!isDragDisabled}
          callbacks={this.callbacks}
          getDraggableRef={this.getDraggableRef}
          // by default we do not allow dragging on interactive elements
          canDragInteractiveElements={disableInteractiveElementBlocking}
        >
          {(dragHandleProps: ?DragHandleProps) =>
            this.renderChildren(offset, dragHandleProps)
          }
        </DragHandle>
      </DraggableDimensionPublisher>
    );
  }
}
