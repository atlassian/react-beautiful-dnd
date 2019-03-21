// @flow
import React, { type Node } from 'react';
import { type Position } from 'css-box-model';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import invariant from 'tiny-invariant';
import type { DroppableId, MovementMode, TypeId } from '../../types';
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
  DraggableStyle,
  MappedProps,
} from './draggable-types';
import getStyle from './get-style';
import getWindowScroll from '../window/get-window-scroll';
import throwIfRefIsInvalid from '../throw-if-invalid-inner-ref';
import checkOwnProps from './check-own-props';

export default class Draggable extends React.Component<Props> {
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
    const mapped: MappedProps = this.props.mapped;
    const isDropping: boolean =
      mapped.type === 'DRAGGING' && Boolean(mapped.dropping);

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

  getProvided = memoizeOne(
    (mapped: MappedProps, dragHandleProps: ?DragHandleProps): Provided => {
      const style: DraggableStyle = getStyle(mapped);
      const onTransitionEnd =
        mapped.type === 'DRAGGING' && Boolean(mapped.dropping)
          ? this.onMoveEnd
          : null;

      const result: Provided = {
        innerRef: this.setRef,
        draggableProps: {
          'data-react-beautiful-dnd-draggable': this.styleContext,
          style,
          onTransitionEnd,
        },
        dragHandleProps,
      };

      return result;
    },
  );

  renderChildren = (dragHandleProps: ?DragHandleProps): Node | null => {
    const { children, mapped } = this.props;
    return children(this.getProvided(mapped, dragHandleProps), mapped.snapshot);
  };

  render() {
    const {
      draggableId,
      index,
      mapped,
      isDragDisabled,
      disableInteractiveElementBlocking,
    } = this.props;
    const droppableId: DroppableId = this.context[droppableIdKey];
    const type: TypeId = this.context[droppableTypeKey];
    const isDragging: boolean = mapped.type === 'DRAGGING';
    const isDropAnimating: boolean =
      mapped.type === 'DRAGGING' && Boolean(mapped.dropping);

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
