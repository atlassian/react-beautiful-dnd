// @flow
import { type Position, type Spacing, type Rect } from 'css-box-model';
import type { DroppableDimension } from '../../types';
import isPartiallyVisibleThroughFrame from './is-partially-visible-through-frame';
import isTotallyVisibleThroughFrame from './is-totally-visible-through-frame';
import isTotallyVisibleThroughFrameOnAxis from './is-totally-visible-through-frame-on-axis';
import { offsetByPosition } from '../spacing';
import { origin } from '../position';

export type Args = {|
  target: Spacing,
  destination: DroppableDimension,
  viewport: Rect,
  withDroppableDisplacement: boolean,
  shouldCheckDroppable?: boolean,
  shouldCheckViewport?: boolean,
|};

type IsVisibleThroughFrameFn = (
  frame: Spacing,
) => (subject: Spacing) => boolean;

type InternalArgs = {|
  ...Args,
  isVisibleThroughFrameFn: IsVisibleThroughFrameFn,
|};

const getDroppableDisplaced = (
  target: Spacing,
  destination: DroppableDimension,
): Spacing => {
  const displacement: Position = destination.frame
    ? destination.frame.scroll.diff.displacement
    : origin;

  return offsetByPosition(target, displacement);
};

const isVisibleInDroppable = (
  target: Spacing,
  destination: DroppableDimension,
  isVisibleThroughFrameFn: IsVisibleThroughFrameFn,
): boolean => {
  // destination subject is totally hidden by frame
  // this should never happen - but just guarding against it
  if (!destination.subject.active) {
    return false;
  }

  // When considering if the target is visible in the droppable we need
  // to consider the change in scroll of the droppable. We need to
  // adjust for the scroll as the clipped viewport takes into account
  // the scroll of the droppable.

  return isVisibleThroughFrameFn(destination.subject.active)(target);
};

const isVisibleInViewport = (
  target: Spacing,
  viewport: Rect,
  isVisibleThroughFrameFn: IsVisibleThroughFrameFn,
): boolean => isVisibleThroughFrameFn(viewport)(target);

const isVisible = ({
  target: toBeDisplaced,
  destination,
  viewport,
  withDroppableDisplacement,
  isVisibleThroughFrameFn,
}: InternalArgs): boolean => {
  const displacedTarget: Spacing = withDroppableDisplacement
    ? getDroppableDisplaced(toBeDisplaced, destination)
    : toBeDisplaced;

  return (
    isVisibleInDroppable(
      displacedTarget,
      destination,
      isVisibleThroughFrameFn,
    ) && isVisibleInViewport(displacedTarget, viewport, isVisibleThroughFrameFn)
  );
};

export const isPartiallyVisible = (args: Args): boolean =>
  isVisible({
    ...args,
    isVisibleThroughFrameFn: isPartiallyVisibleThroughFrame,
  });

export const isTotallyVisible = (args: Args): boolean =>
  isVisible({
    ...args,
    isVisibleThroughFrameFn: isTotallyVisibleThroughFrame,
  });

export const isTotallyVisibleOnAxis = (args: Args): boolean =>
  isVisible({
    ...args,
    isVisibleThroughFrameFn: isTotallyVisibleThroughFrameOnAxis(
      args.destination.axis,
    ),
  });
