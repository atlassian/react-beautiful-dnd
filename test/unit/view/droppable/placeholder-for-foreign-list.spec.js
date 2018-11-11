// @flow
import type { ReactWrapper } from 'enzyme';
import mount from './util/mount';
import {
  foreignOwnProps,
  isOverForeign,
  ownProps,
  isOverHome,
} from './util/get-props';
import Placeholder from '../../../../src/view/placeholder';

it('should render a placeholder when in a foreign list', () => {
  const wrapper: ReactWrapper = mount({
    ownProps: foreignOwnProps,
    mapProps: isOverForeign,
  });

  expect(wrapper.find(Placeholder)).toHaveLength(1);
});

it('should not render a placeholder when in a home list', () => {
  const wrapper: ReactWrapper = mount({
    ownProps,
    mapProps: isOverHome,
  });

  expect(wrapper.find(Placeholder)).toHaveLength(0);
});
