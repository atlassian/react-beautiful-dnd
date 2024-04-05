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
  DraggableRubric,
  DroppableMode,
} from '../../types';
import type { DraggableChildrenFn } from '../draggable/draggable-types';
import { updateViewportMaxScroll } from '../../state/action-creators';

export type DraggableChildrenFn;

export type DroppableProps = {|
  // used for shared global styles
  'data-rbd-droppable-context-id': ContextId,
  // Used to lookup. Currently not used for drag and drop lifecycle
  'data-rbd-droppable-id': DroppableId,
|};

export type Provided = {|
  innerRef: (?HTMLElement) => void,
  placeholder: ?Node,
  droppableProps: DroppableProps,
|};

export type UseClone = {|
  dragging: DraggableRubric,
  render: DraggableChildrenFn,
|};

export type StateSnapshot = {|
  // Is the Droppable being dragged over?
  isDraggingOver: boolean,
  // What is the id of the draggable that is dragging over the Droppable?
  draggingOverWith: ?DraggableId,
  // What is the id of the draggable that is dragging from this list?
  // Useful for styling the home list when not being dragged over
  draggingFromThisWith: ?DraggableId,
  // Whether or not the placeholder is actively being used.
  // This is useful information when working with virtual lists
  isUsingPlaceholder: boolean,
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
  mode: DroppableMode,
  type: TypeId,
  isDropDisabled: boolean,
  isCombineEnabled: boolean,
  direction: Direction,
  renderClone: ?DraggableChildrenFn,
  ignoreContainerClipping: boolean,
  getContainerForClone: () => HTMLElement,
|};

export type DispatchProps = {|
  updateViewportMaxScroll: typeof updateViewportMaxScroll,
|};

export type DroppableChildrenFn = (
  Provided,
  StateSnapshot,
) => Node;

export type OwnProps = {|
  ...DefaultProps,
  children: DroppableChildrenFn,
  droppableId: DroppableId,
  renderClone: ?DraggableChildrenFn,
|};

export type Props = {|
  ...MapProps,
  ...DispatchProps,
  ...OwnProps,
|};

// Having issues getting the correct type
// export type Selector = OutputSelector<State, OwnProps, MapProps>;
export type Selector = (state: State, ownProps: OwnProps) => MapProps;
