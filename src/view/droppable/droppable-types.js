// @flow
import { type Node } from 'react';
import type {
  DraggableId,
  DroppableId,
  TypeId,
  Direction,
  Placeholder,
  State,
  ContextId,
  DraggableLocation,
} from '../../types';
import type {
  StateSnapshot as DraggableStateSnapshot,
  Provided as DraggableProvided,
} from '../draggable/draggable-types';
import { updateViewportMaxScroll } from '../../state/action-creators';

export type DroppableProps = {|
  // used for shared global styles
  'data-rbd-droppable-context-id': ContextId,
|};

export type Provided = {|
  innerRef: (?HTMLElement) => void,
  placeholder: ?Node,
  droppableProps: DroppableProps,
|};

export type RenderClone = (
  provided: DraggableProvided,
  snapshot: DraggableStateSnapshot,
  source: DraggableLocation,
) => Node;

export type UseClone = {|
  draggableId: DraggableId,
  source: DraggableLocation,
  render: RenderClone,
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
  useClone: ?UseClone,
|};

export type DefaultProps = {|
  type: TypeId,
  isDropDisabled: boolean,
  isCombineEnabled: boolean,
  direction: Direction,
  ignoreContainerClipping: boolean,
  getContainerForClone: () => HTMLElement,
|};

export type DispatchProps = {|
  updateViewportMaxScroll: typeof updateViewportMaxScroll,
|};

export type OwnProps = {|
  ...DefaultProps,
  children: (Provided, StateSnapshot) => Node,
  droppableId: DroppableId,
  // TODO: hoist these types up?
  whenDraggingClone?: RenderClone,
|};

export type Props = {|
  ...MapProps,
  ...DispatchProps,
  ...OwnProps,
|};

// Having issues getting the correct type
// export type Selector = OutputSelector<State, OwnProps, MapProps>;
export type Selector = (state: State, ownProps: OwnProps) => MapProps;
