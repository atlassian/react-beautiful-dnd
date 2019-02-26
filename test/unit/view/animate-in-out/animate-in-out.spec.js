// @flow
import React from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import AnimateInOut, {
  type AnimateProvided,
} from '../../../../src/view/animate-in-out/animate-in-out';

it('should allow children not to be rendered (no animation allowed)', () => {
  const child = jest.fn().mockReturnValue(<div>hi</div>);

  const wrapper: ReactWrapper<*> = mount(
    <AnimateInOut on={null} shouldAnimate={false}>
      {child}
    </AnimateInOut>,
  );

  expect(wrapper.children()).toHaveLength(0);
  expect(child).not.toHaveBeenCalled();
});

it('should allow children not to be rendered (even when animation is allowed)', () => {
  const child = jest.fn().mockReturnValue(<div>hi</div>);

  const wrapper: ReactWrapper<*> = mount(
    <AnimateInOut on={null} shouldAnimate>
      {child}
    </AnimateInOut>,
  );

  expect(wrapper.children()).toHaveLength(0);
  expect(child).not.toHaveBeenCalled();
});

it('should pass data through to children', () => {
  const child = jest.fn().mockReturnValue(<div>hi</div>);
  const data = { hello: 'world' };

  const wrapper: ReactWrapper<*> = mount(
    <AnimateInOut on={data} shouldAnimate={false}>
      {child}
    </AnimateInOut>,
  );

  const expected: AnimateProvided = {
    data,
    animate: 'none',
    // $ExpectError - wrong type
    onClose: expect.any(Function),
  };
  expect(child).toHaveBeenCalledWith(expected);

  wrapper.unmount();
});

it('should open instantly if required', () => {
  const child = jest.fn().mockReturnValue(<div>hi</div>);
  const data = { hello: 'world' };

  const wrapper: ReactWrapper<*> = mount(
    <AnimateInOut on={data} shouldAnimate={false}>
      {child}
    </AnimateInOut>,
  );

  const expected: AnimateProvided = {
    data,
    animate: 'none',
    // $ExpectError - wrong type
    onClose: expect.any(Function),
  };
  expect(child).toHaveBeenCalledWith(expected);

  wrapper.unmount();
});

it('should animate open if requested', () => {
  const child = jest.fn().mockReturnValue(<div>hi</div>);
  const data = { hello: 'world' };

  const wrapper: ReactWrapper<*> = mount(
    <AnimateInOut on={data} shouldAnimate>
      {child}
    </AnimateInOut>,
  );

  const expected: AnimateProvided = {
    data,
    animate: 'open',
    // $ExpectError - wrong type
    onClose: expect.any(Function),
  };
  expect(child).toHaveBeenCalledWith(expected);

  wrapper.unmount();
});

it('should close instantly if required', () => {
  const child = jest.fn().mockReturnValue(<div>hi</div>);
  const data = { hello: 'world' };

  const wrapper: ReactWrapper<*> = mount(
    <AnimateInOut on={data} shouldAnimate={false}>
      {child}
    </AnimateInOut>,
  );

  const initial: AnimateProvided = {
    data,
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
  expect(wrapper.children()).toHaveLength(0);
  expect(child).not.toHaveBeenCalled();
});

it('should animate closed if required', () => {
  const child = jest.fn().mockReturnValue(<div>hi</div>);
  const data = { hello: 'world' };

  const wrapper: ReactWrapper<*> = mount(
    <AnimateInOut on={data} shouldAnimate={false}>
      {child}
    </AnimateInOut>,
  );

  const initial: AnimateProvided = {
    data,
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
    animate: 'close',
    // $ExpectError - wrong type
    onClose: expect.any(Function),
  };
  expect(child).toHaveBeenCalledWith(second);

  // telling AnimateInOut that the animation is finished
  const provided: AnimateProvided = child.mock.calls[0][0];
  child.mockClear();
  // this will trigger a setState that will stop rendering the child
  provided.onClose();
  // tell enzyme to reconcile the react tree due to the setState
  wrapper.update();

  expect(wrapper.children()).toHaveLength(0);
  expect(child).not.toHaveBeenCalled();
});
