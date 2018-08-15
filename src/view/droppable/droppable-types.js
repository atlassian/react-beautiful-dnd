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
  isDraggingOver: boolean,
  draggingOverWith: ?DraggableId,
|};

export type MapProps = {|
  isDraggingOver: boolean,
  // The id of the draggable that is dragging over
  draggingOverWith: ?DraggableId,
  // placeholder is used to hold space when
  // not the user is dragging over a list that
  // is not the source list
  placeholder: ?Placeholder,
|};

export type OwnProps = {|
  children: (Provided, StateSnapshot) => ?Node,
  droppableId: DroppableId,
  type: TypeId,
  isDropDisabled: boolean,
  isGroupingEnabled: boolean,
  direction: Direction,
  ignoreContainerClipping: boolean,
|};

export type DefaultProps = {|
  type: string,
  isDropDisabled: boolean,
  isGroupingEnabled: false,
  direction: Direction,
  ignoreContainerClipping: boolean,
|};

export type Props = {|
  ...OwnProps,
  ...MapProps,
|};

// Having issues getting the correct type
// export type Selector = OutputSelector<State, OwnProps, MapProps>;
export type Selector = (state: State, ownProps: OwnProps) => MapProps;
