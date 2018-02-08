// @flow
import type { Node } from 'react';
import type {
  DroppableId,
  TypeId,
  Direction,
  Placeholder,
} from '../../types';

export type DroppableProps = {|
  // used for shared global styles
  'data-react-beautiful-dnd-droppable': string,
  // used for improved screen reader messaging
  role: string,
|}

export type Provided = {|
  innerRef: (?HTMLElement) => void,
  placeholder: ?Node,
  droppableProps: DroppableProps,
|}

export type StateSnapshot = {|
  isDraggingOver: boolean,
|}

export type MapProps = {|
  isDraggingOver: boolean,
  // placeholder is used to hold space when
  // not the user is dragging over a list that
  // is not the source list
  placeholder: ?Placeholder,
|}

export type OwnProps = {|
  children: (Provided, StateSnapshot) => ?Node,
  droppableId: DroppableId,
  type: TypeId,
  isDropDisabled: boolean,
  direction: Direction,
  ignoreContainerClipping: boolean,
|};

export type DefaultProps = {|
  type: string,
  isDropDisabled: boolean,
  direction: Direction,
  ignoreContainerClipping: boolean,
|}

export type Props = {|
  ...OwnProps,
  ...MapProps,
|}

// Having issues getting the correct reselect type
// export type Selector = OutputSelector<State, OwnProps, MapProps>;
export type Selector = Function;
