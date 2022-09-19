// @flow
import type { Position, Rect, Spacing } from 'css-box-model';
import { apply, isEqual, origin } from '../../../position';
import getScrollOnAxis from './get-scroll-on-axis';
import adjustForSizeLimits from './adjust-for-size-limits';
import { horizontal, vertical } from '../../../axis';
import didStartInScrollThreshold from './did-start-in-scroll-threshold';
import getDistanceThresholds, {
  type DistanceThresholds,
} from './get-scroll-on-axis/get-distance-thresholds';

// will replace -0 and replace with +0
const clean = apply((value: number) => (value === 0 ? 0 : value));

type Args = {|
  dragStartTime: number,
  container: Rect,
  subject: Rect,
  center: Position,
  centerIntitial: Position,
  shouldUseTimeDampening: boolean,
|};

export default ({
  dragStartTime,
  container,
  subject,
  center,
  centerIntitial,
  shouldUseTimeDampening,
}: Args): ?Position => {
  // get distance to each edge
  const distanceToEdges: Spacing = {
    top: center.y - container.top,
    right: container.right - center.x,
    bottom: container.bottom - center.y,
    left: center.x - container.left,
  };

  const thresholdsVertical: DistanceThresholds = getDistanceThresholds(
    container,
    vertical,
  );

  const thresholdsHorizontal: DistanceThresholds = getDistanceThresholds(
    container,
    horizontal,
  );

  // 1. Figure out which x,y values are the best target
  // 2. Can the container scroll in that direction at all?
  // If no for both directions, then return null
  // 3. Is the center close enough to a edge to start a drag?
  // 4. Based on the distance, calculate the speed at which a scroll should occur
  // The lower distance value the faster the scroll should be.
  // Maximum speed value should be hit before the distance is 0
  // Negative values to not continue to increase the speed
  const y: number = getScrollOnAxis({
    container,
    distanceToEdges,
    dragStartTime,
    axis: vertical,
    shouldUseTimeDampening,
    thresholds: thresholdsVertical,
  });
  const x: number = getScrollOnAxis({
    container,
    distanceToEdges,
    dragStartTime,
    axis: horizontal,
    shouldUseTimeDampening,
    thresholds: thresholdsHorizontal,
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

  // if the draggable originates inside a scroll threshold
  // don't autoscroll in that threshold's direction until dragged in that direction
  const buffered: Position = didStartInScrollThreshold({
    center,
    centerIntitial,
    container,
    scroll: limited,
    thresholdsHorizontal,
    thresholdsVertical,
  });

  return isEqual(buffered, origin) ? null : buffered;
};
