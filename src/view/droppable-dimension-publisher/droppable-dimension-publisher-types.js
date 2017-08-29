// @flow
import { Select as ReselectSelector } from 'reselect';
import type {
  DroppableDimension,
  DroppableId,
  TypeId,
  ReactElement,
  HTMLElement,
  Position,
  Direction,
  State,
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
  direction: Direction,
  type: TypeId,
  targetRef: ?HTMLElement,
  children?: ReactElement,
|}

export type Props = MapProps & DispatchProps & OwnProps;

export type Selector = ReselectSelector<State, OwnProps, MapProps>;
