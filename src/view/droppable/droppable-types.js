// @flow
import { type Node } from 'react';
import type {
  DraggableId,
  DroppableId,
  TypeId,
  Direction,
  Placeholder,
  State,
} from '../../types';
import { updateViewportMaxScroll } from '../../state/action-creators';

export type DroppableProps = {|
  // used for shared global styles
  'data-react-beautiful-dnd-droppable': string,
|};

export type Provided = {|
  innerRef: (?HTMLElement) => void,
  placeholder: ?Node,
  droppableProps: DroppableProps,
|};

export type StateSnapshot = {|
  // Is the Droppable being dragged over?
  isDraggingOver: boolean,
  // What is the id of the draggable that is dragging over the Droppable?
  draggingOverWith: ?DraggableId,
  // What is the id of the draggable that is dragging from this list?
  // Useful for styling the home list when not being dragged over
  draggingFromThisWith: ?DraggableId,
|};

export type MapProps = {|
  isDraggingOver: boolean,
  // The id of the draggable that is dragging over
  draggingOverWith: ?DraggableId,
  // placeholder is used to hold space when
  // not the user is dragging over a list that
  // is not the source list
  placeholder: ?Placeholder,
  shouldAnimatePlaceholder: boolean,
  // when dragging from a home list this will be populated even when not over the list
  draggingFromThisWith: ?DraggableId,
|};

export type DefaultProps = {|
  type: TypeId,
  isDropDisabled: boolean,
  isCombineEnabled: boolean,
  direction: Direction,
  ignoreContainerClipping: boolean,
|};

export type DispatchProps = {|
  updateViewportMaxScroll: typeof updateViewportMaxScroll,
|};

export type OwnProps = {|
  ...DefaultProps,
  children: (Provided, StateSnapshot) => Node,
  droppableId: DroppableId,
|};

export type Props = {|
  ...MapProps,
  ...DispatchProps,
  ...OwnProps,
|};

// Having issues getting the correct type
// export type Selector = OutputSelector<State, OwnProps, MapProps>;
export type Selector = (state: State, ownProps: OwnProps) => MapProps;
