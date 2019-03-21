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
  // placeholder:
  // - used to keep space in the home list during the whole drag and drop
  // - used to make space in foreign lists during a drag
  placeholder: ?Placeholder,
  shouldAnimatePlaceholder: boolean,
  // snapshot based on redux state to be provided to consumers
  snapshot: StateSnapshot,
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
