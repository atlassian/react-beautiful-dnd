// @flow
import React from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import Placeholder from './util/placeholder-with-class';
import type { PlaceholderStyle } from '../../../../src/view/placeholder/placeholder-types';
import { expectIsEmpty, expectIsFull } from './util/expect';
import { placeholder } from './util/data';
import getPlaceholderStyle from './util/get-placeholder-style';
import * as attributes from '../../../../src/view/data-attributes';

jest.useFakeTimers();
const styleContext: string = 'hello-there';

const getCreatePlaceholderCalls = spy => {
  return spy.mock.calls.filter(call => {
    return call[1] && call[1][attributes.placeholder] === styleContext;
  });
};

it('should animate a mount', () => {
  const spy = jest.spyOn(React, 'createElement');

  const wrapper: ReactWrapper<*> = mount(
    <Placeholder
      animate="open"
      placeholder={placeholder}
      onClose={jest.fn()}
      onTransitionEnd={jest.fn()}
      styleContext={styleContext}
    />,
  );

  const calls = getCreatePlaceholderCalls(spy);
  expect(calls.length).toBe(2);

  // first call had an empty size
  const onMount: PlaceholderStyle = calls[0][1].style;
  expectIsEmpty(onMount);

  const postMount: PlaceholderStyle = getPlaceholderStyle(wrapper);
  expectIsFull(postMount);
});
