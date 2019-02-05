// @flow
import React from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import AnimateInOut, {
  type AnimateProvided,
} from '../../../../src/view/animate-in-out/animate-in-out';

it('should allow children not to be rendered (no animation allowed)', () => {
  const child = jest.fn();

  const wrapper: ReactWrapper = mount(
    <AnimateInOut on={null} shouldAnimate={false}>
      {child}
    </AnimateInOut>,
  );

  const expected: AnimateProvided = {
    data: null,
    isVisible: false,
    animate: 'none',
    // $ExpectError - wrong type
    onClose: expect.any(Function),
  };
  expect(child).toHaveBeenCalledWith(expected);
  wrapper.unmount();
});

it('should allow children not to be rendered (even when animation is allowed)', () => {
  const child = jest.fn();

  const wrapper: ReactWrapper = mount(
    <AnimateInOut on={null} shouldAnimate>
      {child}
    </AnimateInOut>,
  );

  const expected: AnimateProvided = {
    data: null,
    isVisible: false,
    animate: 'close',
    // $ExpectError - wrong type
    onClose: expect.any(Function),
  };
  expect(child).toHaveBeenCalledWith(expected);
  wrapper.unmount();
});

it('should pass data through to children', () => {
  const child = jest.fn();
  const data = { hello: 'world' };

  const wrapper: ReactWrapper = mount(
    <AnimateInOut on={data} shouldAnimate={false}>
      {child}
    </AnimateInOut>,
  );

  const expected: AnimateProvided = {
    data,
    isVisible: true,
    animate: 'none',
    // $ExpectError - wrong type
    onClose: expect.any(Function),
  };
  expect(child).toHaveBeenCalledWith(expected);

  wrapper.unmount();
});

it('should open instantly if required', () => {
  const child = jest.fn();
  const data = { hello: 'world' };

  const wrapper: ReactWrapper = mount(
    <AnimateInOut on={data} shouldAnimate={false}>
      {child}
    </AnimateInOut>,
  );

  const expected: AnimateProvided = {
    data,
    isVisible: true,
    animate: 'none',
    // $ExpectError - wrong type
    onClose: expect.any(Function),
  };
  expect(child).toHaveBeenCalledWith(expected);

  wrapper.unmount();
});

it('should animate open if requested', () => {
  const child = jest.fn();
  const data = { hello: 'world' };

  const wrapper: ReactWrapper = mount(
    <AnimateInOut on={data} shouldAnimate>
      {child}
    </AnimateInOut>,
  );

  const expected: AnimateProvided = {
    data,
    isVisible: true,
    animate: 'open',
    // $ExpectError - wrong type
    onClose: expect.any(Function),
  };
  expect(child).toHaveBeenCalledWith(expected);

  wrapper.unmount();
});

it('should close instantly if required', () => {
  const child = jest.fn();
  const data = { hello: 'world' };

  const wrapper: ReactWrapper = mount(
    <AnimateInOut on={data} shouldAnimate={false}>
      {child}
    </AnimateInOut>,
  );

  const initial: AnimateProvided = {
    data,
    isVisible: true,
    animate: 'none',
    // $ExpectError - wrong type
    onClose: expect.any(Function),
  };
  expect(child).toHaveBeenCalledWith(initial);
  child.mockClear();

  // start closing
  wrapper.setProps({
    // data is gone! this should trigger a close
    on: null,
  });
  const expected: AnimateProvided = {
    data: null,
    isVisible: false,
    animate: 'none',
    // $ExpectError - wrong type
    onClose: expect.any(Function),
  };
  expect(child).toHaveBeenCalledWith(expected);
});

it('should animate closed if required', () => {
  const child = jest.fn();
  const data = { hello: 'world' };

  const wrapper: ReactWrapper = mount(
    <AnimateInOut on={data} shouldAnimate={false}>
      {child}
    </AnimateInOut>,
  );

  const initial: AnimateProvided = {
    data,
    isVisible: true,
    animate: 'none',
    // $ExpectError - wrong type
    onClose: expect.any(Function),
  };
  expect(child).toHaveBeenCalledWith(initial);
  expect(child).toHaveBeenCalledTimes(1);
  child.mockClear();

  // start closing
  wrapper.setProps({
    shouldAnimate: true,
    // data is gone! this should trigger a close
    on: null,
  });
  const second: AnimateProvided = {
    // data is still provided to child for final render
    data,
    // still visible while animating
    isVisible: true,
    animate: 'close',
    // $ExpectError - wrong type
    onClose: expect.any(Function),
  };
  expect(child).toHaveBeenCalledWith(second);

  // telling AnimateInOut that the animation is finished
  const provided: AnimateProvided = child.mock.calls[0][0];
  child.mockClear();
  provided.onClose();

  const third: AnimateProvided = {
    // data no longer provided
    data: null,
    // no longer visible
    isVisible: false,
    animate: 'close',
    // $ExpectError - wrong type
    onClose: expect.any(Function),
  };
  expect(child).toHaveBeenCalledWith(third);
});
