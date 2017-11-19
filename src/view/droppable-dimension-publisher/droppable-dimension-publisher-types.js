// @flow
import * as React from 'react';
import {
  publishDroppableDimension,
  updateDroppableDimensionIsEnabled,
  updateDroppableDimensionScroll,
} from '../../state/action-creators';
import type {
  DroppableId,
  TypeId,
  Direction,
} from '../../types';

export type MapProps = {|
  shouldPublish: boolean,
|}

export type DispatchProps = {|
  publish: typeof publishDroppableDimension,
  updateIsEnabled: typeof updateDroppableDimensionIsEnabled,
  updateScroll: typeof updateDroppableDimensionScroll,
|}

export type OwnProps = {|
  droppableId: DroppableId,
  direction: Direction,
  isDropDisabled: boolean,
  type: TypeId,
  targetRef: ?HTMLElement,
  ignoreContainerClipping: boolean,
  children: React.Node,
|}

export type Props = MapProps & DispatchProps & OwnProps;

// Having issues getting the correct reselect type
// export type Selector = OutputSelector<State, OwnProps, MapProps>;
export type Selector = Function;
