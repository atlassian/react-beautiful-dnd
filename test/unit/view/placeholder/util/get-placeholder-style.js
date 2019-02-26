// @flow
import type { ReactWrapper } from 'enzyme';
import type { PlaceholderStyle } from '../../../../../src/view/placeholder/placeholder-types';
import { placeholder } from './data';

export default (wrapper: ReactWrapper<*>): PlaceholderStyle =>
  wrapper.find(placeholder.tagName).props().style;
