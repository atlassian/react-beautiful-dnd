// @flow
import React from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import type { Placeholder as PlaceholderType } from '../../../../src/types';
import Placeholder from '../../../../src/view/placeholder';
import type { PlaceholderStyle } from '../../../../src/view/placeholder/placeholder-types';
import { getPreset } from '../../../utils/dimension';

jest.useFakeTimers();
const preset = getPreset();
const placeholder: PlaceholderType = preset.inHome1.placeholder;

const getStyle = (wrapper: ReactWrapper): PlaceholderStyle =>
  wrapper.find(placeholder.tagName).props().style;

const expectIsEmpty = (style: PlaceholderStyle) => {
  expect(style.width).toBe(0);
  expect(style.height).toBe(0);
  expect(style.marginTop).toBe(0);
  expect(style.marginRight).toBe(0);
  expect(style.marginBottom).toBe(0);
  expect(style.marginLeft).toBe(0);
};

const expectIsFull = (style: PlaceholderStyle) => {
  expect(style.width).toBe(placeholder.client.borderBox.width);
  expect(style.height).toBe(placeholder.client.borderBox.height);
  expect(style.marginTop).toBe(placeholder.client.margin.top);
  expect(style.marginRight).toBe(placeholder.client.margin.right);
  expect(style.marginBottom).toBe(placeholder.client.margin.bottom);
  expect(style.marginLeft).toBe(placeholder.client.margin.left);
};

it('should animate a mount', () => {
  const wrapper: ReactWrapper = mount(
    <Placeholder
      animate="open"
      placeholder={placeholder}
      onClose={jest.fn()}
      onTransitionEnd={jest.fn()}
    />,
  );
  const onMount: PlaceholderStyle = getStyle(wrapper);
  expectIsEmpty(onMount);

  jest.runOnlyPendingTimers();
  // let enzyme know that the react tree has changed due to the set state
  wrapper.update();

  const postMount: PlaceholderStyle = getStyle(wrapper);
  expectIsFull(postMount);
});

it('should not animate a mount if interrupted', () => {
  jest.spyOn(Placeholder.prototype, 'render');

  const wrapper: ReactWrapper = mount(
    <Placeholder
      animate="open"
      placeholder={placeholder}
      onClose={jest.fn()}
      onTransitionEnd={jest.fn()}
    />,
  );
  const onMount: PlaceholderStyle = getStyle(wrapper);
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

  const postMount: PlaceholderStyle = getStyle(wrapper);
  expectIsFull(postMount);

  // validation - no further updates
  Placeholder.prototype.render.mockClear();
  jest.runOnlyPendingTimers();
  wrapper.update();
  expectIsFull(getStyle(wrapper));
  expect(Placeholder.prototype.render).not.toHaveBeenCalled();

  Placeholder.prototype.render.mockRestore();
});

it('should not animate in if unmounted', () => {
  jest.spyOn(console, 'error');

  const wrapper: ReactWrapper = mount(
    <Placeholder
      animate="open"
      placeholder={placeholder}
      onClose={jest.fn()}
      onTransitionEnd={jest.fn()}
    />,
  );
  expectIsEmpty(getStyle(wrapper));

  wrapper.unmount();
  jest.runOnlyPendingTimers();

  // an internal setState would be triggered the timer was
  // not cleared when unmounting
  expect(console.error).not.toHaveBeenCalled();
  console.error.mockRestore();
});
