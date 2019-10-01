// @flow
import { invariant } from '../invariant';

import type { DroppableDimension, Scrollable } from '../types';

export default (droppable: DroppableDimension): Scrollable => {
  const frame: ?Scrollable = droppable.frame;
  invariant(frame, 'Expected Droppable to have a frame');
  return frame;
};
