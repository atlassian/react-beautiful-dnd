// @flow
import type { ReactWrapper } from 'enzyme';
import type { StateSnapshot } from '../../../../src/view/droppable/droppable-types';
import mount from './util/mount';
import getStubber from './util/get-stubber';
import {
  isNotOverHome,
  isOverHome,
  homeAtRest,
  isOverForeign,
  foreignOwnProps,
} from './util/get-props';

it('should let a consumer know when a home list is being dragged over', () => {
  const myMock = jest.fn();
  mount({
    mapProps: isOverHome,
    WrappedComponent: getStubber(myMock),
  });

  const snapshot: StateSnapshot = myMock.mock.calls[0][0].snapshot;

  const expected: StateSnapshot = {
    isDraggingOver: true,
    draggingFromThisWith: isOverHome.draggingOverWith,
    draggingOverWith: isOverHome.draggingOverWith,
  };
  expect(snapshot).toEqual(expected);
});

it('should let a consumer know when a foreign list is being dragged over', () => {
  const myMock = jest.fn();
  mount({
    ownProps: foreignOwnProps,
    mapProps: isOverForeign,
    WrappedComponent: getStubber(myMock),
  });

  const snapshot: StateSnapshot = myMock.mock.calls[0][0].snapshot;

  const expected: StateSnapshot = {
    isDraggingOver: true,
    draggingFromThisWith: null,
    draggingOverWith: isOverHome.draggingOverWith,
  };
  expect(snapshot).toEqual(expected);
});

it('should update snapshot as dragging over changes', () => {
  const myMock = jest.fn();
  const snapshotShouldBe = (expected: StateSnapshot) => {
    const snapshot: StateSnapshot =
      myMock.mock.calls[myMock.mock.calls.length - 1][0].snapshot;
    expect(snapshot).toEqual(expected);
  };
  const noDrag: StateSnapshot = {
    isDraggingOver: false,
    draggingFromThisWith: null,
    draggingOverWith: null,
  };

  const wrapper: ReactWrapper<*> = mount({
    mapProps: homeAtRest,
    WrappedComponent: getStubber(myMock),
  });
  snapshotShouldBe(noDrag);

  myMock.mockClear();
  wrapper.setProps(isOverHome);
  snapshotShouldBe({
    isDraggingOver: true,
    draggingFromThisWith: isOverHome.draggingOverWith,
    draggingOverWith: isOverHome.draggingOverWith,
  });

  // now over foreign list
  wrapper.setProps(isNotOverHome);
  snapshotShouldBe({
    isDraggingOver: false,
    draggingFromThisWith: isOverHome.draggingOverWith,
    draggingOverWith: null,
  });

  // drag is now over
  myMock.mockClear();
  wrapper.setProps(homeAtRest);
  snapshotShouldBe(noDrag);
});
