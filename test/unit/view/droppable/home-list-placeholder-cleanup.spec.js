// @flow
import { act } from 'react-dom/test-utils';
import type { ReactWrapper } from 'enzyme';
import mount from './util/mount';
import {
  homeOwnProps,
  isNotOverHome,
  homeAtRest,
  homePostDropAnimation,
} from './util/get-props';
import Placeholder from '../../../../src/view/placeholder';

it('should not display a placeholder after a flushed drag end in the home list', () => {
  // dropping
  const wrapper: ReactWrapper<*> = mount({
    ownProps: homeOwnProps,
    mapProps: isNotOverHome,
  });

  expect(wrapper.find(Placeholder)).toHaveLength(1);

  wrapper.setProps({
    ...homeAtRest,
  });
  wrapper.update();

  expect(wrapper.find(Placeholder)).toHaveLength(0);
});

it('should animate a placeholder closed in a home list after a drag', () => {
  // dropping
  const wrapper: ReactWrapper<*> = mount({
    ownProps: homeOwnProps,
    mapProps: isNotOverHome,
  });

  expect(wrapper.find(Placeholder)).toHaveLength(1);

  wrapper.setProps({
    ...homePostDropAnimation,
  });
  wrapper.update();

  expect(wrapper.find(Placeholder)).toHaveLength(1);
  expect(homePostDropAnimation.shouldAnimatePlaceholder).toBe(true);

  // finishing the animation
  act(() => {
    wrapper
      .find(Placeholder)
      .props()
      .onClose();
  });

  // let the wrapper know the react tree has changed
  wrapper.update();

  // placeholder is now gone
  expect(wrapper.find(Placeholder)).toHaveLength(0);
});
