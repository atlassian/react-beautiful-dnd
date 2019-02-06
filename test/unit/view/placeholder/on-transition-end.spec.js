// @flow
import React from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import Placeholder from '../../../../src/view/placeholder';
import { expectIsEmpty, expectIsFull } from './util/expect';
import getPlaceholderStyle from './util/get-placeholder-style';
import { placeholder } from './util/data';

jest.useFakeTimers();

it('should only fire a single transitionend event a single time when transitioning multiple properties', () => {
  const onTransitionEnd = jest.fn();
  const onClose = jest.fn();

  const wrapper: ReactWrapper = mount(
    <Placeholder
      animate="open"
      placeholder={placeholder}
      onClose={onClose}
      onTransitionEnd={onTransitionEnd}
    />,
  );
  jest.runOnlyPendingTimers();
  // let enzyme know that the react tree has changed due to the set state
  wrapper.update();
  expectIsFull(getPlaceholderStyle(wrapper));

  // first event: a 'height' event will trigger the handler

  // $ExpectError - not a complete event
  const height: TransitionEvent = {
    propertyName: 'height',
  };
  wrapper.simulate('transitionend', height);
  expect(onTransitionEnd).toHaveBeenCalledTimes(1);
  onTransitionEnd.mockClear();

  // subsequent transition events will not trigger

  // $ExpectError - not a complete event
  const margin: TransitionEvent = {
    propertyName: 'margin',
  };
  // $ExpectError - not a complete event
  const width: TransitionEvent = {
    propertyName: 'width',
  };
  wrapper.simulate('transitionend', margin);
  wrapper.simulate('transitionend', width);
  expect(onTransitionEnd).not.toHaveBeenCalled();

  // another transition event of height would trigger the handler
  wrapper.simulate('transitionend', height);
  expect(onTransitionEnd).toHaveBeenCalledTimes(1);

  // validate: this should not have triggered any close events
  expect(onClose).not.toHaveBeenCalled();
});
