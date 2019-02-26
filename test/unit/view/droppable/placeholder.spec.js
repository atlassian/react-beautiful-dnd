// @flow
import type { ReactWrapper } from 'enzyme';
import mount from './util/mount';
import {
  foreignOwnProps,
  isOverForeign,
  homeOwnProps,
  isOverHome,
  isNotOverHome,
  homeAtRest,
  isNotOverForeign,
} from './util/get-props';
import Placeholder from '../../../../src/view/placeholder';

describe('home list', () => {
  it('should not render a placeholder when not dragging', () => {
    const wrapper: ReactWrapper<*> = mount({
      ownProps: homeOwnProps,
      mapProps: homeAtRest,
    });

    expect(wrapper.find(Placeholder)).toHaveLength(0);
  });

  it('should render a placeholder when dragging over', () => {
    const wrapper: ReactWrapper<*> = mount({
      ownProps: homeOwnProps,
      mapProps: isOverHome,
    });

    expect(wrapper.find(Placeholder)).toHaveLength(1);
  });

  it('should render a placeholder when dragging over nothing', () => {
    const wrapper: ReactWrapper<*> = mount({
      ownProps: homeOwnProps,
      mapProps: isNotOverHome,
    });

    expect(wrapper.find(Placeholder)).toHaveLength(1);
  });

  it('should render a placeholder when dragging over a foreign list', () => {
    const wrapper: ReactWrapper<*> = mount({
      ownProps: homeOwnProps,
      mapProps: isOverForeign,
    });

    expect(wrapper.find(Placeholder)).toHaveLength(1);
  });
});

describe('foreign', () => {
  it('should not render a placeholder when not dragging', () => {
    const wrapper: ReactWrapper<*> = mount({
      ownProps: foreignOwnProps,
      mapProps: homeAtRest,
    });

    expect(wrapper.find(Placeholder)).toHaveLength(0);
  });

  it('should render a placeholder when dragging over', () => {
    const wrapper: ReactWrapper<*> = mount({
      ownProps: foreignOwnProps,
      mapProps: isOverForeign,
    });

    expect(wrapper.find(Placeholder)).toHaveLength(1);
  });

  it('should not render a placeholder when over nothing', () => {
    const wrapper: ReactWrapper<*> = mount({
      ownProps: foreignOwnProps,
      mapProps: isNotOverForeign,
    });

    expect(wrapper.find(Placeholder)).toHaveLength(0);
  });
});
