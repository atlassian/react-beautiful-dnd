// @flow
import type { StateSnapshot } from '../../../../src/view/droppable/droppable-types';
import mount from './util/mount';
import getStubber from './util/get-stubber';
import {
  isNotOverHome,
  isNotOverForeign,
  foreignOwnProps,
} from './util/get-props';
import { preset } from '../draggable/util/get-props';

it('should let a consumer know what is dragging from it if it is the home list', () => {
  const myMock = jest.fn();
  mount({
    mapProps: isNotOverHome,
    WrappedComponent: getStubber(myMock),
    getIsDragging: () => true,
  });

  const snapshot: StateSnapshot = myMock.mock.calls[0][0].snapshot;

  const expected: StateSnapshot = {
    isDraggingOver: false,
    draggingOverWith: null,
    draggingFromList: preset.inHome1.descriptor.id,
  };
  expect(snapshot).toEqual(expected);
});

it('should not publish what is dragging when it is a foreign list', () => {
  const myMock = jest.fn();
  mount({
    ownProps: foreignOwnProps,
    mapProps: isNotOverForeign,
    WrappedComponent: getStubber(myMock),
    getIsDragging: () => true,
  });

  const snapshot: StateSnapshot = myMock.mock.calls[0][0].snapshot;

  const expected: StateSnapshot = {
    isDraggingOver: false,
    draggingOverWith: null,
    // main difference
    draggingFromList: null,
  };
  expect(snapshot).toEqual(expected);
});
