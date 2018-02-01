// @flow
import type { Area } from '../../types';
import getScrollSafeAreaForElement from '../get-scroll-safe-area-for-element';

export default (): Area =>
  getScrollSafeAreaForElement((document.documentElement: any));
