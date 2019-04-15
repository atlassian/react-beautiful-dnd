// @flow
import type { OwnProps } from '../../../../../src/view/draggable/draggable-types';
import mount from '../util/mount';
import { defaultOwnProps } from '../util/get-props';

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockReset();
});

it('should throw if no draggableId is provided', () => {
  const ownProps: OwnProps = {
    ...defaultOwnProps,
  };
  // $ExpectError
  ownProps.draggableId = undefined;
  expect(() => mount({ ownProps })).toThrow();

  // $ExpectError
  ownProps.draggableId = null;
  expect(() => mount({ ownProps })).toThrow();

  // $ExpectError
  ownProps.draggableId = 0;
  expect(() => mount({ ownProps })).toThrow();
});

it('should throw if no index is provided', () => {
  const ownProps: OwnProps = {
    ...defaultOwnProps,
  };
  // $ExpectError
  ownProps.index = undefined;
  expect(() => mount({ ownProps })).toThrow();

  // $ExpectError
  ownProps.index = null;
  expect(() => mount({ ownProps })).toThrow();
});

it('should throw if the index is not an integer', () => {
  const ownProps: OwnProps = {
    ...defaultOwnProps,
  };
  // $ExpectError - string
  ownProps.index = 'what';
  expect(() => mount({ ownProps })).toThrow();

  ownProps.index = 1.1;
  expect(() => mount({ ownProps })).toThrow();
});

it('should throw if isDragDisabled is set to null', () => {
  const ownProps: OwnProps = {
    ...defaultOwnProps,
  };
  // $ExpectError - null
  ownProps.isDragDisabled = null;
  expect(() => mount({ ownProps })).toThrow();
});
