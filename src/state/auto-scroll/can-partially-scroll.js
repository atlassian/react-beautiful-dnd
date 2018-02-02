// @flow
import { add, apply, isEqual, subtract } from '../position';
// TODO: state reaching into VIEW :(
import getWindowScrollPosition from '../../view/get-window-scroll-position';
import getViewport from '../visibility/get-viewport';
import getMaxScroll from '../get-max-scroll';
import type {
  ClosestScrollable,
  DroppableDimension,
  Spacing,
  Position,
  Area,
} from '../../types';

type CanScrollArgs = {|
  max: Position,
  current: Position,
  change: Position,
|}

const origin: Position = { x: 0, y: 0 };

// TODO: should this be round or floor?
const smallestSigned = apply((value: number) => {
  if (value === 0) {
    return 0;
  }
  return value > 0 ? 1 : -1;
});

const isTooFarBack = (targetScroll: Position): boolean =>
  targetScroll.x < 0 || targetScroll.y < 0;

const isTooFarForward = (targetScroll: Position, maxScroll: Position): boolean =>
  targetScroll.x > maxScroll.x || targetScroll.y > maxScroll.y;

export const canPartiallyScroll = ({
  max,
  current,
  change,
}: CanScrollArgs): boolean => {
  // Sure - you can move nowhere if you want
  if (isEqual(change, origin)) {
    return true;
  }

  // Only need to be able to move the smallest amount in the desired direction
  const smallestChange: Position = smallestSigned(change);
  const targetScroll: Position = add(current, smallestChange);

  if (isTooFarBack(targetScroll)) {
    return false;
  }

  if (isTooFarForward(targetScroll, max)) {
    return false;
  }

  return true;
};

const getMaxWindowScroll = (): Position => {
  const el: ?HTMLElement = document.documentElement;

  if (!el) {
    console.error('Cannot find document element');
    return origin;
  }

  const viewport: Area = getViewport();

  // window.innerWidth / innerHeight includes scrollbar
  // however the scrollHeight / scrollWidth do not :(

  const maxScroll: Position = getMaxScroll({
    scrollHeight: el.scrollHeight,
    scrollWidth: el.scrollWidth,
    width: viewport.width,
    height: viewport.height,
  });

  return maxScroll;
};

export const canScrollWindow = (change: Position): boolean => {
  const maxScroll: Position = getMaxWindowScroll();
  const currentScroll: Position = getWindowScrollPosition();

  console.warn('can scroll window?');

  return canPartiallyScroll({
    current: currentScroll,
    max: maxScroll,
    change,
  });
};

export const canScrollDroppable = (
  droppable: DroppableDimension,
  change: Position,
): boolean => {
  const closestScrollable: ?ClosestScrollable = droppable.viewport.closestScrollable;
  // Cannot scroll when there is no scroll container!
  if (!closestScrollable) {
    return false;
  }

  console.warn('can scroll droppable?');

  return canPartiallyScroll({
    current: closestScrollable.scroll.current,
    max: closestScrollable.scroll.max,
    change,
  });
};

type GetOverlapArgs = {|
  current: Position,
  max: Position,
  change: Position,
|}

// We need to figure out how much of the movement
// cannot be done with a scroll
export const getRemainder = ({
  current,
  max,
  change,
}: GetOverlapArgs): ?Position => {
  const canScroll: boolean = canPartiallyScroll({
    current, max, change,
  });

  if (!canScroll) {
    return null;
  }

  const targetScroll: Position = add(current, change);

  if (isTooFarBack(targetScroll)) {
    // if we are moving backwards, any value that is
    // positive change be trimmed
    const trimmed: Position = {
      x: targetScroll.x > 0 ? 0 : targetScroll.x,
      y: targetScroll.y > 0 ? 0 : targetScroll.y,
    };
    return trimmed;
  }

  if (isTooFarForward(targetScroll, max)) {
    const trimmed: Position = {
      x: targetScroll.x < max.x ? 0 : targetScroll.x - max.x,
      y: targetScroll.y < max.y ? 0 : targetScroll.y - max.y,
    };
    return trimmed;
  }

  // no overlap
  return null;
};

export const getWindowOverlap = (change: Position): ?Position => {
  if (!canScrollWindow(change)) {
    return null;
  }

  const max: Position = getMaxWindowScroll();
  const current: Position = getWindowScrollPosition();

  console.warn('getting window overlap');
  return getRemainder({
    current,
    max,
    change,
  });
};

export const getDroppableOverlap = (droppable: DroppableDimension, change: Position): ?Position => {
  if (!canScrollDroppable(droppable, change)) {
    return null;
  }

  const closestScrollable: ?ClosestScrollable = droppable.viewport.closestScrollable;
  // Cannot scroll when there is no scroll container!
  if (!closestScrollable) {
    return null;
  }

  console.log('getting droppable overlap');
  return getRemainder({
    current: closestScrollable.scroll.current,
    max: closestScrollable.scroll.max,
    change,
  });
};
