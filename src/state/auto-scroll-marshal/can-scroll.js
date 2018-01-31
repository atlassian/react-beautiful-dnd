// @flow
import { add, isEqual, subtract } from '../position';
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

const getSmallestSignedValue = (value: number) => {
  if (value === 0) {
    return 0;
  }
  return value > 0 ? 1 : -1;
};

const isTooFarBack = (targetScroll: Position): boolean =>
  targetScroll.y < 0 || targetScroll.x < 0;

const isTooFarForward = (targetScroll: Position, maxScroll: Position): boolean =>
  targetScroll.y > maxScroll.y || targetScroll.x > maxScroll.x;

const canScroll = ({
  max,
  current,
  change,
}: CanScrollArgs): boolean => {
  // Only need to be able to move the smallest amount in the desired direction
  const smallestChange: Position = {
    x: getSmallestSignedValue(change.x),
    y: getSmallestSignedValue(change.y),
  };

  const target: Position = add(current, smallestChange);

  if (isEqual(target, origin)) {
    return false;
  }

  console.log('smallest change', smallestChange);

  if (isTooFarBack(target)) {
    console.log('too far back');
    return false;
  }

  if (isTooFarForward(target, max)) {
    console.log('too far forward');
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

  console.group('can scroll window');
  console.log('max scroll', maxScroll);
  console.log('current', currentScroll);
  console.groupEnd();

  return canScroll({
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

  return canScroll({
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

const getOverlap = ({
  current,
  max,
  change,
}: GetOverlapArgs): ?Position => {
  const target: Position = add(current, change);

  if (isTooFarBack(target)) {
    const overlap: Position = {
      x: target.x,
      y: target.y,
    };
    return overlap;
  }

  if (isTooFarForward(target, max)) {
    console.log('backward overlap');
    const overlap: Position = subtract(target, max);
    return overlap;
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

  return getOverlap({
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

  return getOverlap({
    current: closestScrollable.scroll.current,
    max: closestScrollable.scroll.max,
    change,
  });
};
