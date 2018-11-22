// @flow
import rafSchd from 'raf-schd';
import { type Rect, type Position, type Spacing } from 'css-box-model';
import type {
  Axis,
  DraggingState,
  DroppableDimension,
  DraggableDimension,
  Scrollable,
  Viewport,
  DroppableId,
} from '../../types';
import { horizontal, vertical } from '../axis';
import { apply, isEqual, origin } from '../position';
import { canPartiallyScroll, canScrollWindow } from './can-scroll';
import getBestScrollableDroppable from './get-best-scrollable-droppable';
import whatIsDraggedOver from '../droppable/what-is-dragged-over';
import getFrame from '../get-frame';

// Need to have at least 1px of scroll to trigger a scroll listener
const minScrollPx: number = 1;

// Values used to control how the fluid auto scroll feels
export const config = {
  // percentage distance from edge of container:
  startFrom: 0.25,
  maxSpeedAt: 0.05,
  // pixels per frame
  maxScrollSpeed: 28,
  // ms: how long to dampen the speed of an auto scroll from the start of a drag
  slowWhenDurationLessThan: 1500,
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
|};

// converts the percentages in the config into actual pixel values
export const getPixelThresholds = (
  container: Rect,
  axis: Axis,
): PixelThresholds => {
  const startFrom: number = container[axis.size] * config.startFrom;
  const maxSpeedAt: number = container[axis.size] * config.maxSpeedAt;

  const thresholds: PixelThresholds = {
    startFrom,
    maxSpeedAt,
  };

  return thresholds;
};

const getEasedPercentage = (
  startOfRange: number,
  endOfRange: number,
  current: number,
): number => {
  if (current <= startOfRange) {
    return 0;
  }

  if (current >= endOfRange) {
    return 1;
  }
  const range: number = endOfRange - startOfRange;
  const currentInRange: number = current - startOfRange;
  const percentage: number = currentInRange / range;
  return config.ease(percentage);
};

const getSpeedFromDistance = (
  distanceToEdge: number,
  thresholds: PixelThresholds,
): number => {
  const startOfRange: number = thresholds.maxSpeedAt;
  const endOfRange: number = thresholds.startFrom;
  const current: number = thresholds.startFrom - distanceToEdge;

  const percentage: number = getEasedPercentage(
    startOfRange,
    endOfRange,
    current,
  );

  const speed: number = config.maxScrollSpeed * percentage;

  return speed;
};

const slowByDragDuration = (
  proposedSpeed: number,
  dragStartTime: number,
): number => {
  const startOfRange: number = dragStartTime;
  const endOfRange: number = dragStartTime + config.slowWhenDurationLessThan;
  const current: number = Date.now();

  const percentage: number = getEasedPercentage(
    startOfRange,
    endOfRange,
    current,
  );

  if (percentage >= 1) {
    return proposedSpeed;
  }

  // Need to allow some scroll otherwise scroll listeners won't fire
  const speed: number = minScrollPx + proposedSpeed * percentage;

  // Making sure we do not go over the maxScrollSpeed due to the + mixScrollPx
  return Math.min(speed, config.maxScrollSpeed);
};

type GetSpeedArgs = {|
  distanceToEdge: number,
  thresholds: PixelThresholds,
  dragStartTime: number,
  clientOffset: Position,
  axis: Axis,
|};

const getSpeed = ({
  distanceToEdge,
  thresholds,
  dragStartTime,
  clientOffset,
  axis,
}: GetSpeedArgs): number => {
  const speed: number = getSpeedFromDistance(distanceToEdge, thresholds);

  // Would not have triggered a scroll event
  if (speed < minScrollPx) {
    return 0;
  }

  // too much client movement to consider drag duration
  // TODO: a bit strange if moving backwards?
  if (Math.abs(clientOffset[axis.line]) > thresholds.maxSpeedAt) {
    return speed;
  }

  return slowByDragDuration(speed, dragStartTime);
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

type GetOnAxisArgs = {|
  container: Rect,
  distanceToEdges: Spacing,
  dragStartTime: number,
  clientOffset: Position,
|};

const getY = ({
  container,
  distanceToEdges,
  dragStartTime,
  clientOffset,
}: GetOnAxisArgs): number => {
  const thresholds: PixelThresholds = getPixelThresholds(container, vertical);
  const isCloserToBottom: boolean =
    distanceToEdges.bottom < distanceToEdges.top;

  if (isCloserToBottom) {
    return getSpeed({
      distanceToEdge: distanceToEdges.bottom,
      clientOffset,
      thresholds,
      dragStartTime,
      axis: vertical,
    });
  }

  // closer to top
  return (
    -1 *
    getSpeed({
      distanceToEdge: distanceToEdges.top,
      clientOffset,
      thresholds,
      dragStartTime,
      axis: vertical,
    })
  );
};

const getX = ({
  container,
  distanceToEdges,
  dragStartTime,
  clientOffset,
}: GetOnAxisArgs): number => {
  const thresholds: PixelThresholds = getPixelThresholds(container, horizontal);
  const isCloserToRight: boolean = distanceToEdges.right < distanceToEdges.left;

  if (isCloserToRight) {
    return getSpeed({
      distanceToEdge: distanceToEdges.right,
      clientOffset,
      thresholds,
      dragStartTime,
      axis: horizontal,
    });
  }

  return (
    -1 *
    getSpeed({
      distanceToEdge: distanceToEdges.left,
      clientOffset,
      thresholds,
      dragStartTime,
      axis: horizontal,
    })
  );
};

type GetRequiredScrollArgs = {|
  dragStartTime: number,
  container: Rect,
  subject: Rect,
  center: Position,
  clientOffset: Position,
|};

// returns null if no scroll is required
const getRequiredScroll = ({
  dragStartTime,
  container,
  subject,
  center,
  clientOffset,
}: GetRequiredScrollArgs): ?Position => {
  // get distance to each edge
  const distanceToEdges: Spacing = {
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

  const y: number = getY({
    container,
    distanceToEdges,
    clientOffset,
    dragStartTime,
  });
  const x: number = getX({
    container,
    distanceToEdges,
    clientOffset,
    dragStartTime,
  });

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
    const dragStartTime: number = state.startTime;
    const clientOffset: Position = state.current.client.offset;

    const draggable: DraggableDimension =
      state.dimensions.draggables[state.critical.draggable.id];
    const subject: Rect = draggable.page.marginBox;

    // 1. Can we scroll the viewport?
    if (state.isWindowScrollAllowed) {
      const viewport: Viewport = state.viewport;
      const requiredWindowScroll: ?Position = getRequiredScroll({
        dragStartTime,
        container: viewport.frame,
        subject,
        center,
        clientOffset,
      });

      if (
        requiredWindowScroll &&
        canScrollWindow(viewport, requiredWindowScroll)
      ) {
        scheduleWindowScroll(requiredWindowScroll);
        return;
      }
    }

    // 2. We are not scrolling the window. Can we scroll a Droppable?
    const droppable: ?DroppableDimension = getBestScrollableDroppable({
      center,
      destination: whatIsDraggedOver(state.impact),
      droppables: state.dimensions.droppables,
    });

    // No scrollable targets
    if (!droppable) {
      return;
    }

    // We know this has a closestScrollable
    const frame: Scrollable = getFrame(droppable);

    const requiredFrameScroll: ?Position = getRequiredScroll({
      dragStartTime,
      container: frame.pageMarginBox,
      subject,
      center,
      clientOffset,
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
