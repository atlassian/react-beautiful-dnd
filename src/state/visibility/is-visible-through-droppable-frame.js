// @flow

import { offset } from '../spacing';
import isVisibleThroughFrame from './is-visible-through-frame';
import type {
  DroppableDimension,
  Position,
  Spacing,
} from '../../types';

export default (droppable: DroppableDimension) => {
  // TODO: should this just be the frame!?
  const isVisible = isVisibleThroughFrame(droppable.viewport.clipped);
  const displacement: Position = droppable.viewport.frameScroll.diff.displacement;

  return (spacing: Spacing) => {
    // Taking into account changes in the droppables scroll
    const withScroll: Spacing = offset(spacing, displacement);

    return isVisible(withScroll);
  };
};
