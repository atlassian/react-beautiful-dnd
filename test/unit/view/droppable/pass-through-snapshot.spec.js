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

it('should let a consumer know when a foreign list is being dragged over', () => {
  const myMock = jest.fn();
  mount({
    ownProps: foreignOwnProps,
    mapProps: isOverForeign,
    WrappedComponent: getStubber(myMock),
  });

  const snapshot: StateSnapshot = myMock.mock.calls[0][0].snapshot;

  expect(snapshot).toEqual(isOverForeign.snapshot);
});

it('should update snapshot as dragging over changes', () => {
  const myMock = jest.fn();
  const getLastSnapshot = () => {
    return myMock.mock.calls[myMock.mock.calls.length - 1][0].snapshot;
  };

  const wrapper: ReactWrapper<*> = mount({
    mapProps: homeAtRest,
    WrappedComponent: getStubber(myMock),
  });
  expect(getLastSnapshot()).toBe(homeAtRest.snapshot);

  wrapper.setProps(isOverHome);
  expect(getLastSnapshot()).toBe(isOverHome.snapshot);

  // now over foreign list
  wrapper.setProps(isNotOverHome);
  expect(getLastSnapshot()).toBe(isNotOverHome.snapshot);

  // drag is now over
  wrapper.setProps(homeAtRest);
  expect(getLastSnapshot()).toBe(homeAtRest.snapshot);
});
