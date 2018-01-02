// @flow
import isVisibleThroughFrame from './is-visible-through-frame';
import { offset } from '../spacing';
import type {
  Spacing,
  Position,
  Area,
  DroppableDimension,
} from '../../types';

type Args = {|
  target: Spacing,
  droppable: DroppableDimension,
  viewport: Area,
|}

// will return true if the position is visible:
// 1. within the viewport AND
// 2. within the destination droppable
export default ({
  target,
  droppable,
  viewport,
}: Args): boolean => {
  // not taking into account any changes in scroll for the viewport check
  if (!isVisibleThroughFrame(viewport)(target)) {
    return false;
  }

  // Taking into account any changes in scroll on the droppable to see if
  // the target is in the Droppable's updated visual space
  const displacement: Position = droppable.viewport.frameScroll.diff.displacement;
  const withScroll: Spacing = offset(target, displacement);

  return isVisibleThroughFrame(droppable.page.withMargin)(withScroll);
};
