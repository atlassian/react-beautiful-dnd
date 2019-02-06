// @flow
import React from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import AnimateInOut, {
  type AnimateProvided,
} from '../../../../src/view/animate-in-out/animate-in-out';
import forceUpdate from '../../../utils/force-update';

type ChildProps = {|
  provided: AnimateProvided,
|};

class Child extends React.Component<ChildProps> {
  render() {
    return <div>{this.props.provided.animate}</div>;
  }
}

it('should render children', () => {
  const wrapper: ReactWrapper = mount(
    <AnimateInOut on="hey" shouldAnimate={false}>
      {(provided: AnimateProvided) =>
        provided.isVisible && <Child provided={provided} />
      }
    </AnimateInOut>,
  );

  expect(wrapper.find(Child)).toHaveLength(1);
  wrapper.unmount();
});

it('should allow children not to be rendered', () => {
  {
    const wrapper: ReactWrapper = mount(
      <AnimateInOut on={null} shouldAnimate={false}>
        {(provided: AnimateProvided) =>
          provided.isVisible && <Child provided={provided} />
        }
      </AnimateInOut>,
    );

    expect(wrapper.find(Child)).toHaveLength(0);
    wrapper.unmount();
  }
  // initial animation set to true
  {
    const wrapper: ReactWrapper = mount(
      <AnimateInOut on={null} shouldAnimate>
        {(provided: AnimateProvided) =>
          provided.isVisible && <Child provided={provided} />
        }
      </AnimateInOut>,
    );

    expect(wrapper.find(Child)).toHaveLength(0);
    wrapper.unmount();
  }
});

it('should allow children not to be rendered after a close animation', () => {
  const wrapper: ReactWrapper = mount(
    <AnimateInOut on="hey" shouldAnimate>
      {(provided: AnimateProvided) =>
        provided.isVisible && <Child provided={provided} />
      }
    </AnimateInOut>,
  );
  expect(wrapper.find(Child)).toHaveLength(1);

  // data is gone - will animate closed
  wrapper.setProps({
    on: null,
  });
  expect(wrapper.find(Child)).toHaveLength(1);

  // letting animate-in-out know that the animation is finished
  wrapper
    .find(Child)
    .props()
    .provided.onClose();

  // let enzyme know that the react tree has changed
  wrapper.update();

  expect(wrapper.find(Child)).toHaveLength(0);
  wrapper.unmount();
});
