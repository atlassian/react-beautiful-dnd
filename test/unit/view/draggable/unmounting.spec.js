// @flow
import mount from './util/mount';

it('should unmount without any issues', () => {
  const wrapper = mount({});
  expect(() => wrapper.unmount()).not.toThrow();
});
