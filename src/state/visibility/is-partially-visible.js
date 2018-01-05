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

  // When considering if the target is visible in the droppable we need
  // to consider the change in scroll of the droppable. We need to
  // adjust for the scroll as the clipped viewport takes into account
  // the scroll of the droppable.
  const isVisibleInDroppable: boolean =
    isVisibleThroughFrame(destination.viewport.clipped)(withScroll);

  // We also need to consider whether the destination scroll when detecting
  // if we are visible in the viewport.
  const isVisibleInViewport: boolean =
    isVisibleThroughFrame(viewport)(withScroll);

  return isVisibleInDroppable && isVisibleInViewport;
};
