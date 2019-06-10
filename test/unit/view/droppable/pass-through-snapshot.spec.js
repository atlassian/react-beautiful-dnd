// @flow
import type { ReactWrapper } from 'enzyme';
import mount from './util/mount';
import getStubber from './util/get-stubber';
import {
  isNotOverHome,
  isOverHome,
  homeAtRest,
  isOverForeign,
  foreignOwnProps,
} from './util/get-props';

const getLastSnapshot = (myMock: any) => {
  return myMock.mock.calls[myMock.mock.calls.length - 1][0].snapshot;
};

it('should let a consumer know when a foreign list is being dragged over', () => {
  const myMock = jest.fn();
  mount({
    ownProps: foreignOwnProps,
    mapProps: isOverForeign,
    WrappedComponent: getStubber(myMock),
  });

  expect(getLastSnapshot(myMock)).toEqual(isOverForeign.snapshot);
});

it('should update snapshot as dragging over changes', () => {
  const myMock = jest.fn();

  const wrapper: ReactWrapper<*> = mount({
    mapProps: homeAtRest,
    WrappedComponent: getStubber(myMock),
  });
  expect(getLastSnapshot(myMock)).toBe(homeAtRest.snapshot);

  wrapper.setProps(isOverHome);
  expect(getLastSnapshot(myMock)).toBe(isOverHome.snapshot);

  // now over foreign list
  wrapper.setProps(isNotOverHome);
  expect(getLastSnapshot(myMock)).toBe(isNotOverHome.snapshot);

  // drag is now over
  wrapper.setProps(homeAtRest);
  expect(getLastSnapshot(myMock)).toBe(homeAtRest.snapshot);
});
