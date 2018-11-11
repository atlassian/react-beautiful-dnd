// @flow
import { type Position } from 'css-box-model';
import { add } from '../position';
import type { Scrollable, DroppableDimension } from '../../types';

export default (droppable: DroppableDimension, point: Position): Position => {
  const frame: ?Scrollable = droppable.frame;
  if (!frame) {
    return point;
  }

  return add(point, frame.scroll.diff.displacement);
};
