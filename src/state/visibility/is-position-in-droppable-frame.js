// @flow

import { add } from '../position';
import isPositionInFrame from './is-position-in-frame';
import type {
  DroppableDimension,
  Position,
} from '../../types';

export default (droppable: DroppableDimension) => {
  const isVisible = isPositionInFrame(droppable.viewport.clipped);
  const displacement: Position = droppable.viewport.frameScroll.diff.displacement;

  return (point: Position) => {
    // Taking into account changes in the droppables scroll
    const withScroll: Position = add(point, displacement);

    return isVisible(withScroll);
  };
};
