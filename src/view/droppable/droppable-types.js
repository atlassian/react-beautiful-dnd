// @flow
import * as React from 'react';
import type {
  DroppableId,
  TypeId,
  Direction,
} from '../../types';

export type Placeholder = {|
  height: number,
  width: number,
|}

export type Provided = {|
  innerRef: (?HTMLElement) => void,
  placeholder: ?React.Node,
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
  children: (Provided, StateSnapshot) => ?React.Node,
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

export type Props = OwnProps & MapProps;

// Having issues getting the correct reselect type
// export type Selector = OutputSelector<State, OwnProps, MapProps>;
export type Selector = Function;
