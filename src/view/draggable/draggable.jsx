// @flow
import React, { Component, Fragment, type Node } from 'react';
import { type Position, type BoxModel } from 'css-box-model';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import invariant from 'tiny-invariant';
import { transitions, transforms, combine } from '../animation';
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
  ZIndexOptions,
  DroppingState,
  SecondaryMapProps,
  DraggingMapProps,
  ChildrenFn,
} from './draggable-types';
import getWindowScroll from '../window/get-window-scroll';
import throwIfRefIsInvalid from '../throw-if-invalid-inner-ref';
import checkOwnPropsInDev from './check-own-props-in-dev';

export const zIndexOptions: ZIndexOptions = {
  dragging: 5000,
  dropAnimating: 4500,
};

const getDraggingTransition = (
  shouldAnimateDragMovement: boolean,
  dropping: ?DroppingState,
): string => {
  if (dropping) {
    return transitions.drop(dropping.duration);
  }
  if (shouldAnimateDragMovement) {
    return transitions.jump;
  }
  return transitions.fluid;
};

const getDraggingOpacity = (
  isCombining: boolean,
  isDropAnimating: boolean,
): ?number => {
  // if not combining: no not impact opacity
  if (!isCombining) {
    return null;
  }

  return isDropAnimating ? combine.opacity.drop : combine.opacity.combining;
};

const getShouldDraggingAnimate = (dragging: DraggingMapProps): boolean => {
  if (dragging.forceShouldAnimate != null) {
    return dragging.forceShouldAnimate;
  }
  return dragging.mode === 'SNAP';
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
        props.move({ client: clientSelection }),
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

    // Only running this check on creation.
    // Could run it on updates, but I don't think that would be needed
    // as it is designed to prevent setup issues
    checkOwnPropsInDev(props);
  }

  componentWillUnmount() {
    // releasing reference to ref for cleanup
    this.ref = null;
  }

  onMoveEnd = () => {
    if (this.props.dragging && this.props.dragging.dropping) {
      this.props.dropAnimationFinished();
    }
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
    (dragging: DraggingMapProps): DraggingStyle => {
      const dimension: DraggableDimension = dragging.dimension;
      const box: BoxModel = dimension.client;
      const { offset, combineWith, dropping } = dragging;

      const isCombining: boolean = Boolean(combineWith);

      const shouldAnimate: boolean = getShouldDraggingAnimate(dragging);
      const isDropAnimating: boolean = Boolean(dropping);

      const transform: ?string = isDropAnimating
        ? transforms.drop(offset, isCombining)
        : transforms.moveTo(offset);

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
        transition: getDraggingTransition(shouldAnimate, dropping),
        transform,
        opacity: getDraggingOpacity(isCombining, isDropAnimating),
        // ## Layering
        zIndex: isDropAnimating
          ? zIndexOptions.dropAnimating
          : zIndexOptions.dragging,

        // ## Blocking any pointer events on the dragging or dropping item
        // global styles on cover while dragging
        pointerEvents: 'none',
      };
      return style;
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
      dropping: dragging.dropping,
      mode: dragging.mode,
      draggingOver: dragging.draggingOver,
      combineWith: dragging.combineWith,
      combineTargetFor: null,
    }),
  );

  getSecondarySnapshot = memoizeOne(
    (secondary: SecondaryMapProps): StateSnapshot => ({
      isDragging: false,
      dropping: null,
      mode: null,
      draggingOver: null,
      combineTargetFor: secondary.combineTargetFor,
      combineWith: null,
    }),
  );

  renderChildren = (dragHandleProps: ?DragHandleProps): ?Node => {
    const dragging: ?DraggingMapProps = this.props.dragging;
    const secondary: ?SecondaryMapProps = this.props.secondary;
    const children: ChildrenFn = this.props.children;

    console.log('rendering dragging', this.props.draggableId);

    if (dragging) {
      const child: ?Node = children(
        this.getDraggingProvided(dragging, dragHandleProps),
        this.getDraggingSnapshot(dragging),
      );

      const placeholder: Node = (
        <Placeholder placeholder={dragging.dimension.placeholder} />
      );

      return (
        <Fragment>
          {child}
          {placeholder}
        </Fragment>
      );
    }

    invariant(
      secondary,
      'If no DraggingMapProps are provided, then SecondaryMapProps are required',
    );

    const child: ?Node = children(
      this.getSecondaryProvided(secondary, dragHandleProps),
      this.getSecondarySnapshot(secondary),
    );

    // still wrapping in fragment to avoid reparenting
    return <Fragment>{child}</Fragment>;
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
          // by default we do not allow dragging on interactive elements
          canDragInteractiveElements={disableInteractiveElementBlocking}
        >
          {this.renderChildren}
        </DragHandle>
      </DraggableDimensionPublisher>
    );
  }
}
