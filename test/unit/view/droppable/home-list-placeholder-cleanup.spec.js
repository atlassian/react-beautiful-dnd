// @flow
import type { ReactWrapper } from 'enzyme';
import mount from './util/mount';
import {
  homeOwnProps,
  isNotOverHome,
  homeAtRest,
  homePostDropAnimation,
} from './util/get-props';
import Placeholder from '../../../../src/view/placeholder';
import AnimateInOut from '../../../../src/view/animate-in-out/animate-in-out';

it('should not display a placeholder after a flushed drag end in the home list', () => {
  // dropping
  let isDropping: boolean = true;
  const wrapper: ReactWrapper = mount({
    ownProps: homeOwnProps,
    mapProps: isNotOverHome,
    isDragging: () => false,
    isDropping: () => isDropping,
  });

  expect(wrapper.find(Placeholder)).toHaveLength(1);

  isDropping = false;
  wrapper.setProps({
    ...homeAtRest,
  });
  wrapper.update();

  expect(wrapper.find(Placeholder)).toHaveLength(0);
});

it('should animate a placeholder closed in a home list after a drag', () => {
  // dropping
  let isDropping: boolean = true;
  const wrapper: ReactWrapper = mount({
    ownProps: homeOwnProps,
    mapProps: isNotOverHome,
    isDragging: () => false,
    isDropping: () => isDropping,
  });

  expect(wrapper.find(Placeholder)).toHaveLength(1);

  isDropping = false;
  wrapper.setProps({
    ...homePostDropAnimation,
  });
  wrapper.update();

  expect(wrapper.find(Placeholder)).toHaveLength(1);
  expect(wrapper.find(AnimateInOut).props().shouldAnimate).toBe(true);
  expect(homePostDropAnimation.shouldAnimatePlaceholder).toBe(true);

  // finishing the animation
  wrapper
    .find(Placeholder)
    .props()
    .onClose();

  // let the wrapper know the react tree has changed
  wrapper.update();

  // placeholder is now gone
  expect(wrapper.find(Placeholder)).toHaveLength(0);
});
