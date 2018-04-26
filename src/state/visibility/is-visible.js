// @flow
import isPartiallyVisibleThroughFrame from './is-partially-visible-through-frame';
import isTotallyVisibleThroughFrame from './is-totally-visible-through-frame';
import { offsetByPosition } from '../spacing';
import type {
  Spacing,
  Position,
  Rect,
  DroppableDimension,
} from '../../types';

type Args = {|
  target: Spacing,
  destination: DroppableDimension,
  viewport: Rect,
|}

type HelperArgs = {|
  ...Args,
  isVisibleThroughFrameFn: (frame: Spacing) => (subject: Spacing) => boolean
|}

const origin: Position = { x: 0, y: 0 };

const isVisible = ({
  target,
  destination,
  viewport,
  isVisibleThroughFrameFn,
}: HelperArgs): boolean => {
  const displacement: Position = destination.viewport.closestScrollable ?
    destination.viewport.closestScrollable.scroll.diff.displacement :
    origin;
  const withDisplacement: Spacing = offsetByPosition(target, displacement);

  // destination subject is totally hidden by frame
  // this should never happen - but just guarding against it
  if (!destination.viewport.clippedMarginBox) {
    return false;
  }

  // When considering if the target is visible in the droppable we need
  // to consider the change in scroll of the droppable. We need to
  // adjust for the scroll as the clipped viewport takes into account
  // the scroll of the droppable.
  const isVisibleInDroppable: boolean =
    isVisibleThroughFrameFn(destination.viewport.clippedMarginBox)(withDisplacement);

  // We also need to consider whether the destination scroll when detecting
  // if we are visible in the viewport.
  const isVisibleInViewport: boolean =
    isVisibleThroughFrameFn(viewport)(withDisplacement);

  return isVisibleInDroppable && isVisibleInViewport;
};

export const isPartiallyVisible = ({
  target,
  destination,
  viewport,
}: Args): boolean => isVisible({
  target,
  destination,
  viewport,
  isVisibleThroughFrameFn: isPartiallyVisibleThroughFrame,
});

export const isTotallyVisible = ({
  target,
  destination,
  viewport,
}: Args): boolean => isVisible({
  target,
  destination,
  viewport,
  isVisibleThroughFrameFn: isTotallyVisibleThroughFrame,
});
