// @flow
import type { ReactWrapper } from 'enzyme';
import mount from './util/mount';
import { homeOwnProps, isOverHome, homeAtRest } from './util/get-props';
import Placeholder from '../../../../src/view/placeholder';

it('should not animate a placeholder after a drop', () => {
  let isDragging: boolean = true;
  const wrapper: ReactWrapper = mount({
    ownProps: homeOwnProps,
    mapProps: isOverHome,
    isDragging: () => isDragging,
    isDropping: () => false,
  });

  expect(wrapper.find(Placeholder)).toHaveLength(1);

  // no placeholder even though home.
  isDragging = false;
  wrapper.setProps({
    ...homeAtRest,
  });
  expect(wrapper.find(Placeholder)).toHaveLength(0);

  // validation: we requested placeholder animation
  expect(homeAtRest.shouldAnimatePlaceholder).toBe(true);
});
