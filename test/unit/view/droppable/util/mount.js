// @flow
import React from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import type {
  MapProps,
  OwnProps,
  Provided,
  DispatchProps,
  StateSnapshot,
} from '../../../../../src/view/droppable/droppable-types';
import Droppable from '../../../../../src/view/droppable/droppable';
import {
  homeOwnProps,
  homeAtRest,
  dispatchProps as defaultDispatchProps,
} from './get-props';
import {
  withStore,
  combine,
  withDimensionMarshal,
  withStyleContext,
  withIsMovementAllowed,
} from '../../../../utils/get-context-options';
import getStubber from './get-stubber';

type MountArgs = {|
  WrappedComponent?: any,
  ownProps?: OwnProps,
  mapProps?: MapProps,
  dispatchProps?: DispatchProps,
  isMovementAllowed?: () => boolean,
|};

export default ({
  WrappedComponent = getStubber(),
  ownProps = homeOwnProps,
  mapProps = homeAtRest,
  dispatchProps = defaultDispatchProps,
  isMovementAllowed,
}: MountArgs = {}): ReactWrapper =>
  mount(
    <Droppable {...ownProps} {...mapProps} {...dispatchProps}>
      {(provided: Provided, snapshot: StateSnapshot) => (
        <WrappedComponent provided={provided} snapshot={snapshot} />
      )}
    </Droppable>,
    combine(
      withStore(),
      withDimensionMarshal(),
      withStyleContext(),
      withIsMovementAllowed(isMovementAllowed),
    ),
  );
