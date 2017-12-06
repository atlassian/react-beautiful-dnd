// @flow
import type { Node } from 'react';
import {
  publishDraggableDimension,
} from '../../state/action-creators';
import type {
  DraggableId,
  DroppableId,
  TypeId,
} from '../../types';

export type OwnProps = {|
  draggableId: DraggableId,
  droppableId: DroppableId,
  type: TypeId,
  targetRef: ?HTMLElement,
  children: Node,
|}

export type Props = {|
  ...MapProps,
  ...DispatchProps,
  ...OwnProps
|}

// Having issues getting the correct reselect type
// export type Selector = OutputSelector<State, OwnProps, MapProps>;
export type Selector = Function;
