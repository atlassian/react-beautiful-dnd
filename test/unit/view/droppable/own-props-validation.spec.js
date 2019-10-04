// @flow
import type { OwnProps } from '../../../../src/view/droppable/droppable-types';
import mount from './util/mount';
import { homeOwnProps as defaultOwnProps } from './util/get-props';
import { withError } from '../../../util/console';

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  // $FlowFixMe
  console.error.mockReset();
});

it('should throw if no droppableId is provided', () => {
  const ownProps: OwnProps = {
    ...defaultOwnProps,
  };

  withError(() => {
    // $ExpectError - not provided
    ownProps.droppableId = undefined;
    mount({ ownProps });
  });

  withError(() => {
    // $ExpectError - not a string
    ownProps.droppableId = null;
    mount({ ownProps });
  });

  withError(() => {
    // $ExpectError - using number
    ownProps.droppableId = 3;
    mount({ ownProps });
  });
});

it('should throw if isDropDisabled is set to null', () => {
  const ownProps: OwnProps = {
    ...defaultOwnProps,
  };
  withError(() => {
    // $ExpectError - null
    ownProps.isDropDisabled = null;
    mount({ ownProps });
  });
});

it('should throw if isCombineEnabled is set to null', () => {
  const ownProps: OwnProps = {
    ...defaultOwnProps,
  };
  withError(() => {
    // $ExpectError - null
    ownProps.isCombineEnabled = null;
    mount({ ownProps });
  });
});

it('should throw if ignoreContainerClipping is set to null', () => {
  const ownProps: OwnProps = {
    ...defaultOwnProps,
  };
  withError(() => {
    // $ExpectError - null
    ownProps.ignoreContainerClipping = null;
    mount({ ownProps });
  });
});
