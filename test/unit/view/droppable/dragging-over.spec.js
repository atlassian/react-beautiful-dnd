// @flow
import type { StateSnapshot } from '../../../../src/view/droppable/droppable-types';
import mount from './util/mount';
import getStubber from './util/get-stubber';
import { isNotOver, isOverHome } from './util/get-props';

it('should let a consumer know when a list is not being dragged over', () => {
  const myMock = jest.fn();
  mount({
    mapProps: isNotOver,
    WrappedComponent: getStubber(myMock),
  });

  const snapshot: StateSnapshot = myMock.mock.calls[0][0].snapshot;

  const expected: StateSnapshot = {
    isDraggingOver: false,
    draggingOverWith: null,
  };
  expect(snapshot).toEqual(expected);
});

it('should let a consumer know when a list is being dragged over', () => {
  const myMock = jest.fn();
  mount({
    mapProps: isOverHome,
    WrappedComponent: getStubber(myMock),
  });

  const snapshot: StateSnapshot = myMock.mock.calls[0][0].snapshot;

  const expected: StateSnapshot = {
    isDraggingOver: true,
    draggingOverWith: isOverHome.draggingOverWith,
  };
  expect(snapshot).toEqual(expected);
});
