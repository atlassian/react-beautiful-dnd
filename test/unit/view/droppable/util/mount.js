// @flow
import React from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import type {
  MapProps,
  OwnProps,
  Provided,
  StateSnapshot,
} from '../../../../../src/view/droppable/droppable-types';
import Droppable from '../../../../../src/view/droppable/droppable';
import { ownProps as defaultOwnProps, atRest } from './get-props';
import {
  withStore,
  combine,
  withDimensionMarshal,
  withStyleContext,
} from '../../../../utils/get-context-options';

type MountArgs = {|
  WrappedComponent: any,
  ownProps?: OwnProps,
  mapProps?: MapProps,
|};

export default ({
  WrappedComponent,
  ownProps = defaultOwnProps,
  mapProps = atRest,
}: MountArgs = {}): ReactWrapper =>
  mount(
    // $ExpectError - using spread
    <Droppable {...ownProps} {...mapProps}>
      {(provided: Provided, snapshot: StateSnapshot) => (
        <WrappedComponent provided={provided} snapshot={snapshot} />
      )}
    </Droppable>,
    combine(withStore(), withDimensionMarshal(), withStyleContext()),
  );
