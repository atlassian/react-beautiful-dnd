// @flow
import type { ReactWrapper } from 'enzyme';

export default (wrapper: ReactWrapper<*>) => {
  const el: HTMLElement = wrapper.getDOMNode();
  // raw event
  el.blur();
  // let the wrapper know about it
  wrapper.simulate('blur');
};
