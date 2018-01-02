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
// 2. within the destination Droppable
export default ({
  target,
  destination,
  viewport,
}: Args): boolean => {
  const displacement: Position = destination.viewport.frameScroll.diff.displacement;
  const withScroll: Spacing = offset(target, displacement);

  // Taking into account any changes in scroll on the Droppable to see if
  // the target is in the Droppable's updated visual frame
  return isVisibleThroughFrame(viewport)(withScroll) &&
  // Need to also take into account changes in droppable scroll when
  // checking if the target is visible in the viewport.
  // Changes in the destination scroll impact the current position
  // of the target
    isVisibleThroughFrame(destination.viewport.clipped)(withScroll);
};
