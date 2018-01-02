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
  destination: DroppableDimension,
  viewport: Area,
|}

// will return true if the position is visible:
// 1. within the viewport AND
// 2. within the destination droppable
export default ({
  target,
  destination,
  viewport,
}: Args): boolean => {
  // not taking into account any changes in scroll for the viewport check
  if (!isVisibleThroughFrame(viewport)(target)) {
    return false;
  }

  // Taking into account any changes in scroll on the Droppable to see if
  // the target is in the Droppable's updated visual frame
  const displacement: Position = destination.viewport.frameScroll.diff.displacement;
  const withScroll: Spacing = offset(target, displacement);

  // TODO: use frame? do we even need .clipped?
  return isVisibleThroughFrame(destination.viewport.clipped)(withScroll);
};
