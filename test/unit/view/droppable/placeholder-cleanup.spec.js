// @flow
import type { ReactWrapper } from 'enzyme';
import mount from './util/mount';
import { homeOwnProps, isNotOverHome, homeAtRest } from './util/get-props';
import Placeholder from '../../../../src/view/placeholder';

it('should not display a placeholder after a drag end in the home list', () => {
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
