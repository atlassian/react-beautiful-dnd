// @flow
import React, { type Node } from 'react';
import { mount } from 'enzyme';
import useMemoOne from '../../../../src/view/use-custom-memo/use-memo-one';

type WithMemoProps = {|
  inputs: mixed[],
  children: (value: mixed) => Node,
  getResult: () => mixed,
|};

function WithMemo(props: WithMemoProps) {
  const value: mixed = useMemoOne(props.getResult, props.inputs);
  return props.children(value);
}

it('should not break the cache on multiple calls', () => {
  const mock = jest.fn().mockReturnValue(<div>hey</div>);
  const wrapper = mount(
    <WithMemo inputs={[1, 2]} getResult={() => ({ hello: 'world' })}>
      {mock}
    </WithMemo>,
  );

  // initial call
  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock).toHaveBeenCalledWith({ hello: 'world' });
  const initial: mixed = mock.mock.calls[0][0];
  expect(initial).toEqual({ hello: 'world' });
  mock.mockClear();

  wrapper.setProps({ inputs: [1, 2] });

  expect(mock).toHaveBeenCalledWith(initial);
  const second: mixed = mock.mock.calls[0][0];
  // same reference
  expect(initial).toBe(second);
});

it('should break the cache when the inputs change', () => {
  const mock = jest.fn().mockReturnValue(<div>hey</div>);
  const wrapper = mount(
    <WithMemo inputs={[1, 2]} getResult={() => ({ hello: 'world' })}>
      {mock}
    </WithMemo>,
  );

  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock).toHaveBeenCalledWith({ hello: 'world' });
  const initial: mixed = mock.mock.calls[0][0];
  expect(initial).toEqual({ hello: 'world' });
  mock.mockClear();

  // inputs are different
  wrapper.setProps({ inputs: [1, 2, 3] });

  expect(mock).toHaveBeenCalledWith(initial);
  expect(mock).toHaveBeenCalledTimes(1);
  const second: mixed = mock.mock.calls[0][0];
  // different reference
  expect(initial).not.toBe(second);
});

it('should use the latest get result function when the cache breaks', () => {
  const mock = jest.fn().mockReturnValue(<div>hey</div>);
  const wrapper = mount(
    <WithMemo inputs={[1, 2]} getResult={() => ({ hello: 'world' })}>
      {mock}
    </WithMemo>,
  );

  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock).toHaveBeenCalledWith({ hello: 'world' });
  const initial: mixed = mock.mock.calls[0][0];
  expect(initial).toEqual({ hello: 'world' });
  mock.mockClear();

  // inputs are different
  wrapper.setProps({
    inputs: [1, 2, 3],
    getResult: () => ({ different: 'value' }),
  });

  expect(mock).toHaveBeenCalledWith({ different: 'value' });
  expect(mock).toHaveBeenCalledTimes(1);
});
