// @flow
import * as React from 'react';
import {
  publishDraggableDimension,
} from '../../state/action-creators';
import type {
  DraggableId,
  DroppableId,
  TypeId,
} from '../../types';

export type MapProps = {|
  shouldPublish: boolean,
|}

export type DispatchProps = {|
  publish: typeof publishDraggableDimension,
|}

export type OwnProps = {|
  draggableId: DraggableId,
  droppableId: DroppableId,
  type: TypeId,
  targetRef: ?HTMLElement,
  children: React.Node,
|}

export type Props = {
  ...MapProps,
  ...DispatchProps,
  ...OwnProps
}

// Having issues getting the correct reselect type
// export type Selector = OutputSelector<State, OwnProps, MapProps>;
export type Selector = Function;
