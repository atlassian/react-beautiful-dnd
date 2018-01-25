// @flow
import isPartiallyVisibleThroughFrame from './is-partially-visible-through-frame';
import isTotallyVisibleThroughFrame from './is-totally-visible-through-frame';
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

type HelperArgs = {|
  ...Args,
  isVisibleThroughFrameFn: (frame: Spacing) => (subject: Spacing) => boolean
|}

const isVisible = ({
  target,
  destination,
  viewport,
  isVisibleThroughFrameFn,
}: HelperArgs): boolean => {
  const displacement: Position = destination.viewport.frameScroll.diff.displacement;
  const withScroll: Spacing = offset(target, displacement);

  // destination subject is totally hidden by frame
  // this should never happen - but just guarding against it
  if (!destination.viewport.clipped) {
    return false;
  }

  // When considering if the target is visible in the droppable we need
  // to consider the change in scroll of the droppable. We need to
  // adjust for the scroll as the clipped viewport takes into account
  // the scroll of the droppable.
  const isVisibleInDroppable: boolean =
    isVisibleThroughFrameFn(destination.viewport.clipped)(withScroll);

  // We also need to consider whether the destination scroll when detecting
  // if we are visible in the viewport.
  const isVisibleInViewport: boolean =
    isVisibleThroughFrameFn(viewport)(withScroll);

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
