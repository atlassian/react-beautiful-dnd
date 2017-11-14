// @flow
import type { HTMLElement } from '../types';

export default (ref: ?HTMLElement): HTMLElement =>
  (ref ? ref.ownerDocument.defaultView : window);
