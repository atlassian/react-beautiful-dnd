// @flow
import type { Position, Rect } from 'css-box-model';
import { type DistanceThresholds } from '../../../../types';

type Args = {|
  center: Position,
  centerIntitial: Position,
  container: Rect,
  scroll: Position,
  thresholdsHorizontal: DistanceThresholds,
  thresholdsVertical: DistanceThresholds,
  distanceToEdges: any,
|};

const THRESHOLD_BUFFER = 24;

export default ({
  center,
  centerIntitial,
  container,
  scroll,
  thresholdsHorizontal,
  thresholdsVertical,
  distanceToEdges, // maybe we can utilize these values instead of the doubled THRESHOLD_BUFFER?
}: Args): Position => {
  if (
    center.x > container.width - thresholdsHorizontal.startScrollingFrom &&
    center.x < centerIntitial.x + THRESHOLD_BUFFER
  ) {
    scroll.x = 0;
  } else if (
    center.x < thresholdsHorizontal.startScrollingFrom &&
    center.x > centerIntitial.x - THRESHOLD_BUFFER
  ) {
    scroll.x = 0;
  }

  // console.log({
  //   'center.y': center.y,
  //   'container.height': container.height,
  //   startScrollingFrom: thresholdsVertical.startScrollingFrom,
  //   'centerIntitial.y': centerIntitial.y,
  //   'window.scrollY': window.scrollY,
  // });

  const itemIsInsideThresholdTop =
    center.y < thresholdsVertical.startScrollingFrom + window.scrollY;

  const itemIsInsideThresholdBottom =
    center.y >
    container.height - thresholdsVertical.startScrollingFrom + window.scrollY;

  const hasDraggedUp = center.y < centerIntitial.y - THRESHOLD_BUFFER;

  const hasDraggedDown = center.y > centerIntitial.y + THRESHOLD_BUFFER;

  // I do NOT like this, but including the doubled THRESHOLD_BUFFER in this calculation
  // seems to be the right ballpark to allow the draggable to "push through" and continue
  // the scroll if it catches on it's initial position
  const hasScrolledCenterIntialUp =
    centerIntitial.y - THRESHOLD_BUFFER * 2 < container.top;

  const hasScrolledCenterIntialDown =
    centerIntitial.y + THRESHOLD_BUFFER * 2 > container.bottom;

  if (itemIsInsideThresholdTop) {
    if (hasDraggedUp || hasScrolledCenterIntialUp) {
      // noop
    } else {
      // stomp
      scroll.y = 0;
    }
  } else if (itemIsInsideThresholdBottom) {
    if (hasDraggedDown || hasScrolledCenterIntialDown) {
      // noop
    } else {
      // stomp
      scroll.y = 0;
    }
  }

  // This is the previous implementaion for vertical scrolling, here for reference

  // if (
  //   center.y > container.height - thresholdsVertical.startScrollingFrom &&
  //   center.y < centerIntitial.y + THRESHOLD_BUFFER
  // ) {
  //   console.log('stomping on scroll DOWN');
  //   scroll.y = 0;
  // } else if (
  //   center.y < thresholdsVertical.startScrollingFrom &&
  //   center.y > centerIntitial.y - THRESHOLD_BUFFER
  // ) {
  //   console.log('stomping on scroll UP');
  //   scroll.y = 0;
  // }

  return scroll;
};
