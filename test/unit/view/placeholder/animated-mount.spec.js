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

  wrapper.setProps({
    animate: 'none',
  });

  jest.runOnlyPendingTimers();
  // let enzyme know that the react tree has changed due to the set state
  wrapper.update();

  const postMount: PlaceholderStyle = getStyle(wrapper);
  expectIsFull(postMount);
});
