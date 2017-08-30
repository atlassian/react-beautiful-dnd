// @flow
/* eslint-disable import/no-extraneous-dependencies */
// $ExpectError - not added to project deps
import type { PropType } from 'babel-plugin-react-flow-props-to-prop-types';
/* eslint-enable */
import {
  publishDraggableDimension,
} from '../../state/action-creators';
import type {
  DraggableId,
  DroppableId,
  TypeId,
  ReactElement,
  HTMLElement,
} from '../../types';

export type MapProps = {|
  shouldPublish: boolean,
|}

export type DispatchProps = {|
  publish: PropType<typeof publishDraggableDimension, Function>,
|}

export type OwnProps = {|
  draggableId: DraggableId,
  droppableId: DroppableId,
  type: TypeId,
  targetRef: ?HTMLElement,
  children?: ReactElement,
|}

export type Props = MapProps & DispatchProps & OwnProps;

// Having issues getting the correct reselect type
// export type Selector = OutputSelector<State, OwnProps, MapProps>;
export type Selector = Function;
