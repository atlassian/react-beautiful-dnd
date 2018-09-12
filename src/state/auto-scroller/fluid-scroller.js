// @flow
import rafSchd from 'raf-schd';
import type { Rect, Position, Spacing } from 'css-box-model';
import { horizontal, vertical } from '../axis';
import { apply, isEqual, origin } from '../position';
import { canPartiallyScroll, canScrollWindow } from './can-scroll';
import getBestScrollableDroppable from './get-best-scrollable-droppable';
import whatIsDraggedOver from '../droppable/what-is-dragged-over';
import type {
  Axis,
  DraggingState,
  DroppableDimension,
  DraggableDimension,
  Scrollable,
  Viewport,
  DroppableId,
} from '../../types';

// Values used to control how the fluid auto scroll feels
export const config = {
  // percentage distance from edge of container:
  startFrom: 0.25,
  maxSpeedAt: 0.05,
  // pixels per frame
  maxScrollSpeed: 28,
  // A function used to ease the distance been the startFrom and maxSpeedAt values
  // A simple linear function would be: (percentage) => percentage;
  // percentage is between 0 and 1
  // result must be between 0 and 1
  ease: (percentage: number) => Math.pow(percentage, 2),
};

// will replace -0 and replace with +0
const clean = apply((value: number) => (value === 0 ? 0 : value));

export type PixelThresholds = {|
  startFrom: number,
  maxSpeedAt: number,
  accelerationPlane: number,
|};

// converts the percentages in the config into actual pixel values
export const getPixelThresholds = (
  container: Rect,
  axis: Axis,
): PixelThresholds => {
  const startFrom: number = container[axis.size] * config.startFrom;
  const maxSpeedAt: number = container[axis.size] * config.maxSpeedAt;
  const accelerationPlane: number = startFrom - maxSpeedAt;

  const thresholds: PixelThresholds = {
    startFrom,
    maxSpeedAt,
    accelerationPlane,
  };

  return thresholds;
};

const getSpeed = (distance: number, thresholds: PixelThresholds): number => {
  // Not close enough to the edge
  if (distance >= thresholds.startFrom) {
    return 0;
  }

  // Already past the maxSpeedAt point

  if (distance <= thresholds.maxSpeedAt) {
    return config.maxScrollSpeed;
  }

  // We need to perform a scroll as a percentage of the max scroll speed

  const distancePastStart: number = thresholds.startFrom - distance;
  const percentage: number = distancePastStart / thresholds.accelerationPlane;
  const transformed: number = config.ease(percentage);

  const speed: number = config.maxScrollSpeed * transformed;

  return speed;
};

type AdjustForSizeLimitsArgs = {|
  container: Rect,
  subject: Rect,
  proposedScroll: Position,
|};

const adjustForSizeLimits = ({
  container,
  subject,
  proposedScroll,
}: AdjustForSizeLimitsArgs): ?Position => {
  const isTooBigVertically: boolean = subject.height > container.height;
  const isTooBigHorizontally: boolean = subject.width > container.width;

  // not too big on any axis
  if (!isTooBigHorizontally && !isTooBigVertically) {
    return proposedScroll;
  }

  // too big on both axis
  if (isTooBigHorizontally && isTooBigVertically) {
    return null;
  }

  // Only too big on one axis
  // Exclude the axis that we cannot scroll on
  return {
    x: isTooBigHorizontally ? 0 : proposedScroll.x,
    y: isTooBigVertically ? 0 : proposedScroll.y,
  };
};

type GetRequiredScrollArgs = {|
  container: Rect,
  subject: Rect,
  center: Position,
|};

// returns null if no scroll is required
const getRequiredScroll = ({
  container,
  subject,
  center,
}: GetRequiredScrollArgs): ?Position => {
  // get distance to each edge
  const distance: Spacing = {
    top: center.y - container.top,
    right: container.right - center.x,
    bottom: container.bottom - center.y,
    left: center.x - container.left,
  };

  // 1. Figure out which x,y values are the best target
  // 2. Can the container scroll in that direction at all?
  // If no for both directions, then return null
  // 3. Is the center close enough to a edge to start a drag?
  // 4. Based on the distance, calculate the speed at which a scroll should occur
  // The lower distance value the faster the scroll should be.
  // Maximum speed value should be hit before the distance is 0
  // Negative values to not continue to increase the speed

  const y: number = (() => {
    const thresholds: PixelThresholds = getPixelThresholds(container, vertical);
    const isCloserToBottom: boolean = distance.bottom < distance.top;

    if (isCloserToBottom) {
      return getSpeed(distance.bottom, thresholds);
    }

    // closer to top
    return -1 * getSpeed(distance.top, thresholds);
  })();

  const x: number = (() => {
    const thresholds: PixelThresholds = getPixelThresholds(
      container,
      horizontal,
    );
    const isCloserToRight: boolean = distance.right < distance.left;

    if (isCloserToRight) {
      return getSpeed(distance.right, thresholds);
    }

    // closer to left
    return -1 * getSpeed(distance.left, thresholds);
  })();

  const required: Position = clean({ x, y });

  // nothing required
  if (isEqual(required, origin)) {
    return null;
  }

  // need to not scroll in a direction that we are too big to scroll in
  const limited: ?Position = adjustForSizeLimits({
    container,
    subject,
    proposedScroll: required,
  });

  if (!limited) {
    return null;
  }

  return isEqual(limited, origin) ? null : limited;
};

type Api = {|
  scrollWindow: (change: Position) => void,
  scrollDroppable: (id: DroppableId, change: Position) => void,
|};

type ResultFn = (state: DraggingState) => void;
type ResultCancel = { cancel: () => void };

export type FluidScroller = ResultFn & ResultCancel;

export default ({ scrollWindow, scrollDroppable }: Api): FluidScroller => {
  const scheduleWindowScroll = rafSchd(scrollWindow);
  const scheduleDroppableScroll = rafSchd(scrollDroppable);

  const scroller = (state: DraggingState): void => {
    const center: Position = state.current.page.borderBoxCenter;

    // 1. Can we scroll the viewport?

    const draggable: DraggableDimension =
      state.dimensions.draggables[state.critical.draggable.id];
    const subject: Rect = draggable.page.marginBox;
    const viewport: Viewport = state.viewport;

    // Don't do page scrolling when over a fixed droppable
    const requiredWindowScroll: ?Position = getRequiredScroll({
      container: viewport.frame,
      subject,
      center,
    });

    if (
      state.autoScrollWindow &&
      requiredWindowScroll &&
      canScrollWindow(viewport, requiredWindowScroll)
    ) {
      scheduleWindowScroll(requiredWindowScroll);
      return;
    }

    // 2. We are not scrolling the window. Can we scroll a Droppable?
    const droppable: ?DroppableDimension = getBestScrollableDroppable({
      center,
      destination: state.impact.destination,
      droppables: state.dimensions.droppables,
    });

    // No scrollable targets
    if (!droppable) {
      return;
    }

    // We know this has a closestScrollable
    const frame: ?Scrollable = droppable.frame;

    // this should never happen - just being safe
    if (!frame) {
      return;
    }

    const requiredFrameScroll: ?Position = getRequiredScroll({
      container: frame.pageMarginBox,
      subject,
      center,
    });

    if (!requiredFrameScroll) {
      return;
    }

    const canScrollDroppable: boolean = canPartiallyScroll({
      current: frame.scroll.current,
      max: frame.scroll.max,
      change: requiredFrameScroll,
    });

    if (canScrollDroppable) {
      scheduleDroppableScroll(droppable.descriptor.id, requiredFrameScroll);
    }
  };

  scroller.cancel = () => {
    scheduleWindowScroll.cancel();
    scheduleDroppableScroll.cancel();
  };

  return scroller;
};
