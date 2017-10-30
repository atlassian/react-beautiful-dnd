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
  children?: ReactElement,
  droppableId: DroppableId,
  direction: Direction,
  ignoreContainerClipping: boolean,
  isDropDisabled: boolean,
  targetRef: ?HTMLElement,
  type: TypeId,
|}

export type Props = {
  ...MapProps,
  ...DispatchProps,
  ...OwnProps
}

// Having issues getting the correct reselect type
// export type Selector = OutputSelector<State, OwnProps, MapProps>;
export type Selector = Function;
