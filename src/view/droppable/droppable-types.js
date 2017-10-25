// @flow
import type { HasDefaultProp } from 'babel-plugin-react-flow-props-to-prop-types';
import type {
  DroppableId,
  TypeId,
  ReactElement,
  HTMLElement,
  Direction,
} from '../../types';

export type Placeholder = {|
  height: number,
  width: number,
|}

export type Provided = {|
  innerRef: (?HTMLElement) => void,
  placeholder: ?ReactElement,
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
  children: (Provided, StateSnapshot) => ?ReactElement,
  direction: HasDefaultProp<Direction>,
  droppableId: DroppableId,
  ignoreContainerClipping: boolean,
  isDropDisabled: HasDefaultProp<boolean>,
  type: HasDefaultProp<TypeId>,
|};

export type DefaultProps = {|
  isDropDisabled: boolean,
  type: TypeId
|}

export type Props = OwnProps & MapProps;

// Having issues getting the correct reselect type
// export type Selector = OutputSelector<State, OwnProps, MapProps>;
export type Selector = Function;
