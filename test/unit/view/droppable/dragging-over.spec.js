// @flow
import type { ReactWrapper } from 'enzyme';
import type { StateSnapshot } from '../../../../src/view/droppable/droppable-types';
import mount from './util/mount';
import getStubber from './util/get-stubber';
import { isNotOver, isOverHome, atRest } from './util/get-props';

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

it('should update snapshot as dragging over changes', () => {
  const myMock = jest.fn();
  const snapshotShouldBe = (expected: StateSnapshot) => {
    const snapshot: StateSnapshot = myMock.mock.calls[0][0].snapshot;
    expect(snapshot).toEqual(expected);
  };
  const whenAtRest: StateSnapshot = {
    isDraggingOver: false,
    draggingOverWith: null,
  };

  const wrapper: ReactWrapper = mount({
    mapProps: atRest,
    WrappedComponent: getStubber(myMock),
  });
  snapshotShouldBe(whenAtRest);

  myMock.mockClear();
  wrapper.setProps(isOverHome);
  snapshotShouldBe({
    isDraggingOver: true,
    draggingOverWith: isOverHome.draggingOverWith,
  });

  myMock.mockClear();
  wrapper.setProps(atRest);
  snapshotShouldBe(whenAtRest);
});
