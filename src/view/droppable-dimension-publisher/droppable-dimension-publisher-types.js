// @flow
import type {
  DroppableDimension,
  DroppableId,
  TypeId,
  ReactElement,
  HTMLElement,
  Position,
  Direction,
} from '../../types';

export type MapProps = {|
  shouldPublish: boolean,
|}

export type DispatchProps = {|
  publish: (dimension: DroppableDimension) => mixed,
  updateIsEnabled: (id: DroppableId, isEnabled: boolean) => mixed,
  updateScroll: (id: DroppableId, offset: Position) => mixed,
|}

export type OwnProps = {|
  droppableId: DroppableId,
  direction: Direction,
  isDropDisabled: boolean,
  type: TypeId,
  targetRef: ?HTMLElement,
  children?: ReactElement,
|}

export type Props = MapProps & DispatchProps & OwnProps;

// Having issues getting the correct reselect type
// export type Selector = OutputSelector<State, OwnProps, MapProps>;
export type Selector = Function;
