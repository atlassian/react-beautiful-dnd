// @flow
import React, { type Node } from 'react';
import { act } from 'react-dom/test-utils';
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

type ChildProps = {|
  provided: AnimateProvided,
|};

class Child extends React.Component<ChildProps> {
  render() {
    return <div>{this.props.provided.animate}</div>;
  }
}

it('should render children', () => {
  const wrapper: ReactWrapper<*> = mount(
    <WithUseAnimateInOut on="hey" shouldAnimate={false}>
      {(provided: ?AnimateProvided) =>
        provided ? <Child provided={provided} /> : null
      }
    </WithUseAnimateInOut>,
  );

  expect(wrapper.find(Child)).toHaveLength(1);
  wrapper.unmount();
});

it('should allow children not to be rendered', () => {
  {
    const wrapper: ReactWrapper<*> = mount(
      <WithUseAnimateInOut on={null} shouldAnimate={false}>
        {(provided: ?AnimateProvided) =>
          provided ? <Child provided={provided} /> : null
        }
      </WithUseAnimateInOut>,
    );

    expect(wrapper.find(Child)).toHaveLength(0);
    wrapper.unmount();
  }
  // initial animation set to true
  {
    const wrapper: ReactWrapper<*> = mount(
      <WithUseAnimateInOut on={null} shouldAnimate>
        {(provided: ?AnimateProvided) =>
          provided ? <Child provided={provided} /> : null
        }
      </WithUseAnimateInOut>,
    );

    expect(wrapper.find(Child)).toHaveLength(0);
    wrapper.unmount();
  }
});

it('should allow children not to be rendered after a close animation', () => {
  const wrapper: ReactWrapper<*> = mount(
    <WithUseAnimateInOut on="hey" shouldAnimate>
      {(provided: ?AnimateProvided) =>
        provided ? <Child provided={provided} /> : null
      }
    </WithUseAnimateInOut>,
  );
  expect(wrapper.find(Child)).toHaveLength(1);

  // data is gone - will animate closed
  wrapper.setProps({
    on: null,
  });
  // let enzyme know that the react tree has changed
  wrapper.update();
  expect(wrapper.find(Child)).toHaveLength(1);

  // letting animate-in-out know that the animation is finished
  act(() => {
    wrapper
      .find(Child)
      .props()
      .provided.onClose();
  });

  // let enzyme know that the react tree has changed
  wrapper.update();
  expect(wrapper.find(Child)).toHaveLength(0);
  wrapper.unmount();
});
