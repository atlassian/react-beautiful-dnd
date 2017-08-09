// @flow

import type {
  DroppableDimension,
  DroppableId,
  TypeId,
  ReactElement,
  HTMLElement,
  Position,
} from '../../types';

export type MapProps = {|
  shouldPublish: boolean,
|}

export type DispatchProps = {|
  publish: (dimension: DroppableDimension) => mixed,
  updateScroll: (id: DroppableId, offset: Position) => mixed,
|}

export type OwnProps = {|
  droppableId: DroppableId,
  type: TypeId,
  targetRef: ?HTMLElement,
  children?: ReactElement,
|}

export type Props = MapProps & DispatchProps & OwnProps;
