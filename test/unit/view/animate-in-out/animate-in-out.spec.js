// @flow
import React, { type Node } from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import useAnimateInOut, {
  type AnimateProvided,
  type Args,
} from '../../../../src/view/use-animate-in-out/use-animate-in-out';

type WithUseAnimateInOutProps = {|
  ...Args,
  children: (provided: ?AnimateProvided) => Node,
|};

function WithUseAnimateInOut(props: WithUseAnimateInOutProps) {
  const { children, ...rest } = props;
  const provided: ?AnimateProvided = useAnimateInOut(rest);
  return props.children(provided);
}

it('should allow children not to be rendered (no animation allowed)', () => {
  const child = jest.fn().mockReturnValue(<div>hi</div>);

  mount(
    <WithUseAnimateInOut on={null} shouldAnimate={false}>
      {child}
    </WithUseAnimateInOut>,
  );

  expect(child).toHaveBeenCalledWith(null);
  expect(child).toHaveBeenCalledTimes(1);
});

it('should allow children not to be rendered (even when animation is allowed)', () => {
  const child = jest.fn().mockReturnValue(<div>hi</div>);

  mount(
    <WithUseAnimateInOut on={null} shouldAnimate>
      {child}
    </WithUseAnimateInOut>,
  );

  expect(child).toHaveBeenCalledWith(null);
  expect(child).toHaveBeenCalledTimes(1);
});

it('should pass data through to children', () => {
  const child = jest.fn().mockReturnValue(<div>hi</div>);
  const data = { hello: 'world' };

  mount(
    <WithUseAnimateInOut on={data} shouldAnimate={false}>
      {child}
    </WithUseAnimateInOut>,
  );

  const expected: AnimateProvided = {
    data,
    animate: 'none',
    // $ExpectError - wrong type
    onClose: expect.any(Function),
  };

  expect(child).toHaveBeenCalledWith(expected);
  expect(child).toHaveBeenCalledTimes(1);
});

it('should open instantly if required', () => {
  const child = jest.fn().mockReturnValue(<div>hi</div>);
  const data = { hello: 'world' };

  const wrapper: ReactWrapper<*> = mount(
    <WithUseAnimateInOut on={data} shouldAnimate={false}>
      {child}
    </WithUseAnimateInOut>,
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
    <WithUseAnimateInOut on={data} shouldAnimate>
      {child}
    </WithUseAnimateInOut>,
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

it.only('should close instantly if required', () => {
  const child = jest.fn().mockReturnValue(<div>hi</div>);
  const data = { hello: 'world' };

  const wrapper: ReactWrapper<*> = mount(
    <WithUseAnimateInOut on={data} shouldAnimate={false}>
      {child}
    </WithUseAnimateInOut>,
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
    // data is gone! this should trigger a close
    on: null,
  });
  expect(child).toHaveBeenCalledWith(null);
  expect(child).toHaveBeenCalledTimes(1);
});

it('should animate closed if required', () => {
  const child = jest.fn().mockReturnValue(<div>hi</div>);
  const data = { hello: 'world' };

  const wrapper: ReactWrapper<*> = mount(
    <WithUseAnimateInOut on={data} shouldAnimate={false}>
      {child}
    </WithUseAnimateInOut>,
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

  expect(child).toHaveBeenCalledWith(null);
  expect(child).toHaveBeenCalledTimes(1);
});
