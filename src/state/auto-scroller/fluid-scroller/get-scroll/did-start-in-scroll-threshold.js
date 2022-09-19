// @flow
import type { Position, Rect } from 'css-box-model';
import { type DistanceThresholds } from './get-scroll-on-axis/get-distance-thresholds';

type Args = {|
  center: Position,
  centerIntitial: Position,
  container: Rect,
  scroll: Position,
  thresholdsHorizontal: DistanceThresholds,
  thresholdsVertical: DistanceThresholds,
|};

const minScrollThreshold = 24;

export default ({
  center,
  centerIntitial,
  container,
  scroll,
  thresholdsHorizontal,
  thresholdsVertical,
}: Args): Position => {
  if (
    center.x > container.width - thresholdsHorizontal.startScrollingFrom &&
    center.x < centerIntitial.x + minScrollThreshold
  ) {
    scroll.x = 0;
  } else if (
    center.x < thresholdsHorizontal.startScrollingFrom &&
    center.x > centerIntitial.x - minScrollThreshold
  ) {
    scroll.x = 0;
  }

  if (
    center.y > container.height - thresholdsVertical.startScrollingFrom &&
    center.y < centerIntitial.y + minScrollThreshold
  ) {
    scroll.y = 0;
  } else if (
    center.y < thresholdsVertical.startScrollingFrom &&
    center.y > centerIntitial.y - minScrollThreshold
  ) {
    scroll.y = 0;
  }

  return scroll;
};
