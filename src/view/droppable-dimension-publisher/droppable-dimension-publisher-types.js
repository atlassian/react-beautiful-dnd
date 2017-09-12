// @flow
import type { PropType } from 'babel-plugin-react-flow-props-to-prop-types';
import {
  publishDroppableDimension,
  updateDroppableDimensionIsEnabled,
  updateDroppableDimensionScroll,
} from '../../state/action-creators';
import type {
  DroppableId,
  TypeId,
  ReactElement,
  HTMLElement,
  Direction,
} from '../../types';

export type MapProps = {|
  shouldPublish: boolean,
|}

export type DispatchProps = {|
  publish: PropType<typeof publishDroppableDimension, Function>,
  updateIsEnabled: PropType<typeof updateDroppableDimensionIsEnabled, Function>,
  updateScroll: PropType<typeof updateDroppableDimensionScroll, Function>,
|}

export type OwnProps = {|
  droppableId: DroppableId,
  direction: Direction,
  isDropDisabled: boolean,
  type: TypeId,
  targetRef: ?HTMLElement,
  children?: ReactElement,
|}

export type Props = {
  ...MapProps,
  ...DispatchProps,
  ...OwnProps
}

// Having issues getting the correct reselect type
// export type Selector = OutputSelector<State, OwnProps, MapProps>;
export type Selector = Function;
