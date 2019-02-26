// @flow
import React from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import type { PlaceholderStyle } from '../../../../src/view/placeholder/placeholder-types';
import Placeholder from '../../../../src/view/placeholder';
import { expectIsEmpty, expectIsFull } from './util/expect';
import { placeholder } from './util/data';
import getPlaceholderStyle from './util/get-placeholder-style';

jest.useFakeTimers();

it('should animate a mount', () => {
  const wrapper: ReactWrapper<*> = mount(
    <Placeholder
      animate="open"
      placeholder={placeholder}
      onClose={jest.fn()}
      onTransitionEnd={jest.fn()}
    />,
  );
  const onMount: PlaceholderStyle = getPlaceholderStyle(wrapper);
  expectIsEmpty(onMount);

  jest.runOnlyPendingTimers();
  // let enzyme know that the react tree has changed due to the set state
  wrapper.update();

  const postMount: PlaceholderStyle = getPlaceholderStyle(wrapper);
  expectIsFull(postMount);
});

it('should not animate a mount if interrupted', () => {
  jest.spyOn(Placeholder.prototype, 'render');

  const wrapper: ReactWrapper<*> = mount(
    <Placeholder
      animate="open"
      placeholder={placeholder}
      onClose={jest.fn()}
      onTransitionEnd={jest.fn()}
    />,
  );
  const onMount: PlaceholderStyle = getPlaceholderStyle(wrapper);
  expectIsEmpty(onMount);
  expect(Placeholder.prototype.render).toHaveBeenCalledTimes(1);

  // interrupting animation
  wrapper.setProps({
    animate: 'none',
  });
  expect(Placeholder.prototype.render).toHaveBeenCalledTimes(2);

  // no timers are run
  // let enzyme know that the react tree has changed due to the set state
  wrapper.update();

  const postMount: PlaceholderStyle = getPlaceholderStyle(wrapper);
  expectIsFull(postMount);

  // validation - no further updates
  Placeholder.prototype.render.mockClear();
  jest.runOnlyPendingTimers();
  wrapper.update();
  expectIsFull(getPlaceholderStyle(wrapper));
  expect(Placeholder.prototype.render).not.toHaveBeenCalled();

  Placeholder.prototype.render.mockRestore();
});

it('should not animate in if unmounted', () => {
  jest.spyOn(console, 'error');

  const wrapper: ReactWrapper<*> = mount(
    <Placeholder
      animate="open"
      placeholder={placeholder}
      onClose={jest.fn()}
      onTransitionEnd={jest.fn()}
    />,
  );
  expectIsEmpty(getPlaceholderStyle(wrapper));

  wrapper.unmount();
  jest.runOnlyPendingTimers();

  // an internal setState would be triggered the timer was
  // not cleared when unmounting
  expect(console.error).not.toHaveBeenCalled();
  console.error.mockRestore();
});
