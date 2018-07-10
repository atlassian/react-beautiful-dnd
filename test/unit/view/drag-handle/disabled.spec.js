// @flow
import type { ReactWrapper } from 'enzyme';
import { getWrapper, Child } from './util/wrappers';
import { getStubCallbacks } from './util/callbacks';

it('should not pass any handleProps to the child', () => {
  const wrapper: ReactWrapper = getWrapper(getStubCallbacks());
  wrapper.setProps({ isEnabled: false });

  expect(wrapper.find(Child).props().dragHandleProps).toBe(null);
});
