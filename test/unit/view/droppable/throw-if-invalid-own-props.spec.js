// @flow
import type { OwnProps } from '../../../../src/view/droppable/droppable-types';
import mount from './util/mount';
import { ownProps as defaultOwnProps } from './util/get-props';

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockReset();
});

it('should throw if no droppableId is provided', () => {
  const ownProps: OwnProps = {
    ...defaultOwnProps,
  };

  // $ExpectError
  ownProps.droppableId = undefined;
  expect(() => mount({ ownProps })).toThrow();

  // $ExpectError
  ownProps.droppableId = null;
  expect(() => mount({ ownProps })).toThrow();

  // $ExpectError
  ownProps.droppableId = 0;
  expect(() => mount({ ownProps })).toThrow();
});

it('should throw if isDropDisabled is set to null', () => {
  const ownProps: OwnProps = {
    ...defaultOwnProps,
  };
  // $ExpectError - null
  ownProps.isDropDisabled = null;
  expect(() => mount({ ownProps })).toThrow();
});

it('should throw if isCombineEnabled is set to null', () => {
  const ownProps: OwnProps = {
    ...defaultOwnProps,
  };
  // $ExpectError - null
  ownProps.isCombineEnabled = null;
  expect(() => mount({ ownProps })).toThrow();
});

it('should throw if ignoreContainerClipping is set to null', () => {
  const ownProps: OwnProps = {
    ...defaultOwnProps,
  };
  // $ExpectError - null
  ownProps.ignoreContainerClipping = null;
  expect(() => mount({ ownProps })).toThrow();
});
