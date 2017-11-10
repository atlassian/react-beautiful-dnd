// @flow
import type { PropType, HasDefaultProp } from 'babel-plugin-react-flow-props-to-prop-types';
import type {
  DraggableId,
  DraggableDimension,
  Position,
  TypeId,
  Direction,
  ZIndex,
  HTMLElement,
  ReactElement,
} from '../../types';
import {
  lift,
  move,
  moveByWindowScroll,
  moveForward,
  moveBackward,
  crossAxisMoveForward,
  crossAxisMoveBackward,
  drop,
  cancel,
  dropAnimationFinished,
} from '../../state/action-creators';
import type {
  Provided as DragHandleProvided,
} from '../drag-handle/drag-handle-types';

// These styles are applied by default to allow for a
// better touch device drag and drop experience.
// Users can opt out of these styles or change them if
// they really need too for their specific use case.
export type BaseStyle = {
  // A long press on anchors usually pops a content menu that has options for
  // the link such as 'Open in new tab'. Because long press is used to start
  // a drag we need to opt out of this behavior
  WebkitTouchCallout: 'none',

  // Webkit based browsers add a grey overlay to anchors when they are active.
  // We remove this tap overlay as it is confusing for users
  // https://css-tricks.com/snippets/css/remove-gray-highlight-when-tapping-links-in-mobile-safari/
  WebkitTapHighlightColor: 'rgba(0,0,0,0)',

  // Added to avoid the *pull to refresh action* and *anchor focus* on Android Chrome
  touchAction: 'none',
}

export type DraggingStyle = BaseStyle & {
  // Allow scrolling of the element behind the dragging element
  pointerEvents: 'none',

  // `position: fixed` is used to ensure that the element is always positioned
  // in the correct position and ignores the surrounding position:relative parents
  position: 'fixed',

  // When we do `position: fixed` the element looses its normal dimensions,
  // especially if using flexbox. We set the width and height manually to
  // ensure the element has the same dimensions as before it started dragging
  width: number,
  height: number,

  // When we set the width and height they include the padding on the element.
  // We use box-sizing: border-box to ensure that the width and height are inclusive of the padding
  boxSizing: 'border-box',

  // We initially position the element in the same visual spot as when it started.
  // To do this we give the element the top / left position with the margins considered
  top: number,
  left: number,

  // We clear any top or left margins on the element to ensure it does not push
  // the element positioned with the top/left position.
  // We also clear the margin right / bottom. This has no positioning impact,
  // but it is cleanest to just remove all the margins rather than only the top and left.
  margin: 0,

  // Move the element in response to a user dragging
  transform: ?string,

  // When dragging or dropping we control the z-index to ensure that
  // the layering is correct
  zIndex: ZIndex,
}

export type NotDraggingStyle = BaseStyle & {
  transition: ?string,
  transform: ?string,
  pointerEvents: 'none' | 'auto',
}

export type DraggableStyle = DraggingStyle | NotDraggingStyle;

export type ZIndexOptions = {|
  dragging: number,
  dropAnimating: number,
|}

export type Provided = {|
  innerRef: (?HTMLElement) => void,
  draggableStyle: ?DraggableStyle,
  dragHandleProps: ?DragHandleProvided,
  placeholder: ?ReactElement,
|}

export type StateSnapshot = {|
  isDragging: boolean,
|}

// Using PropType<*,*> to allow strict typing within code and looser typing
// for React PropTypes
// https://github.com/thejameskyle/babel-plugin-react-flow-props-to-prop-types#override-type-used-in-proptypes
export type DispatchProps = {
  lift: PropType<typeof lift, Function>,
  move: PropType<typeof move, Function>,
  moveByWindowScroll: PropType<typeof moveByWindowScroll, Function>,
  moveForward: PropType<typeof moveForward, Function>,
  moveBackward: PropType<typeof moveBackward, Function>,
  crossAxisMoveForward: PropType<typeof crossAxisMoveForward, Function>,
  crossAxisMoveBackward: PropType<typeof crossAxisMoveBackward, Function>,
  drop: PropType<typeof drop, Function>,
  cancel: PropType<typeof cancel, Function>,
  dropAnimationFinished: PropType<typeof dropAnimationFinished, Function>,
}

export type MapProps = {|
  isDragging: boolean,
  // only provided when dragging
  // can be null if not over a droppable
  direction: ?Direction,
  isDropAnimating: boolean,
  canLift: boolean,
  canAnimate: boolean,
  offset: Position,
  dimension: ?DraggableDimension,
|}

export type OwnProps = {|
  draggableId: DraggableId,
  children: (Provided, StateSnapshot) => ?ReactElement,
  type: HasDefaultProp<TypeId>,
  isDragDisabled: HasDefaultProp<boolean>,
|}

export type DefaultProps = {|
  type: TypeId,
  isDragDisabled: boolean,
|}

export type Props = MapProps & DispatchProps & OwnProps;

// Having issues getting the correct reselect type
// export type Selector = OutputSelector<State, OwnProps, MapProps>;
export type Selector = Function;
