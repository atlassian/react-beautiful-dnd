// @flow
import React from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import type {
  OwnProps,
  MapProps,
  DispatchProps,
  Provided,
  StateSnapshot,
} from '../../../../../src/view/draggable/draggable-types';
import type { StyleMarshal } from '../../../../../src/view/style-marshal/style-marshal-types';
import {
  combine,
  withStore,
  withDroppableId,
  withStyleContext,
  withDimensionMarshal,
  withCanLift,
  withDroppableType,
} from '../../../../utils/get-context-options';
import {
  atRestMapProps,
  getDispatchPropsStub,
  droppable,
  defaultOwnProps,
} from './get-props';
import Item from './item';
import Draggable from '../../../../../src/view/draggable/draggable';

type MountConnected = {|
  ownProps?: OwnProps,
  mapProps?: MapProps,
  dispatchProps?: DispatchProps,
  WrappedComponent?: any,
  styleMarshal?: StyleMarshal,
|};

export default ({
  ownProps = defaultOwnProps,
  mapProps = atRestMapProps,
  dispatchProps = getDispatchPropsStub(),
  WrappedComponent = Item,
  styleMarshal,
}: MountConnected = {}): ReactWrapper<*> => {
  const wrapper: ReactWrapper<*> = mount(
    <Draggable {...ownProps} {...mapProps} {...dispatchProps}>
      {(provided: Provided, snapshot: StateSnapshot) => (
        <WrappedComponent provided={provided} snapshot={snapshot} />
      )}
    </Draggable>,
    combine(
      withStore(),
      withDroppableId(droppable.id),
      withDroppableType(droppable.type),
      withStyleContext(styleMarshal),
      withDimensionMarshal(),
      withCanLift(),
    ),
  );

  return wrapper;
};
