// @flow
import React, { useMemo } from 'react';
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
import getStubber from './get-stubber';
import { getMarshalStub } from '../../../../utils/dimension-marshal';
import AppContext, {
  type AppContextValue,
} from '../../../../../src/view/context/app-context';

type MountArgs = {|
  WrappedComponent?: any,
  ownProps?: OwnProps,
  mapProps?: MapProps,
  dispatchProps?: DispatchProps,
  isMovementAllowed?: () => boolean,
|};

type AppProps = {|
  ...OwnProps,
  ...MapProps,
  ...DispatchProps,
  isMovementAllowed: () => boolean,
  WrappedComponent: any,
|};

function App(props: AppProps) {
  const { WrappedComponent, isMovementAllowed, ...rest } = props;
  const context: AppContextValue = useMemo(
    () => ({
      marshal: getMarshalStub(),
      style: '1',
      canLift: () => true,
      isMovementAllowed,
    }),
    [isMovementAllowed],
  );

  return (
    <AppContext.Provider value={context}>
      <Droppable {...rest}>
        {(provided: Provided, snapshot: StateSnapshot) => (
          <WrappedComponent provided={provided} snapshot={snapshot} />
        )}
      </Droppable>
    </AppContext.Provider>
  );
}

export default ({
  WrappedComponent = getStubber(),
  ownProps = homeOwnProps,
  mapProps = homeAtRest,
  dispatchProps = defaultDispatchProps,
  isMovementAllowed = () => true,
}: MountArgs = {}): ReactWrapper<*> =>
  mount(
    <App
      {...ownProps}
      {...mapProps}
      {...dispatchProps}
      isMovementAllowed={isMovementAllowed}
      WrappedComponent={WrappedComponent}
    />,
  );
