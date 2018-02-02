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
const round = apply(Math.round);
const floor = apply(Math.floor);
const smallestSigned = apply((value: number) => {
  if (value === 0) {
    return 0;
  }
  return value > 0 ? 1 : -1;
});

const isTooFarBack = (targetScroll: Position): boolean => {
  const floored: Position = floor(targetScroll);
  console.log('floored', floored);

  return floored.x < 0 || floored.y < 0;
};

const isTooFarForward = (targetScroll: Position, maxScroll: Position): boolean => {
  const floored: Position = floor(targetScroll);

  return floored.x > maxScroll.x || floored.y > maxScroll.y;
};

// const isTooFarBackInBothDirections = (targetScroll: Position): boolean => {
//   const rounded: Position = round(targetScroll);
//   return rounded.y < 0 && rounded.x < 0;
// };

// const isTooFarForwardInBothDirections = (targetScroll: Position, maxScroll: Position): boolean => {
//   const rounded: Position = round(targetScroll);
//   return rounded.y > maxScroll.y && rounded.x > maxScroll.x;
// };

// const isTooFarBackInEitherDirection = (targetScroll: Position): boolean => {
//   const rounded: Position = round(targetScroll);
//   return rounded.y < 0 || rounded.x < 0;
// };

// const isTooFarForwardInEitherDirection = (targetScroll: Position, maxScroll: Position): boolean => {
//   const rounded: Position = round(targetScroll);
//   return rounded.y > maxScroll.y || rounded.x > maxScroll.x;
// };

const canScroll = ({
  max,
  current,
  change,
}: CanScrollArgs): boolean => {
  // Only need to be able to move the smallest amount in the desired direction
  const smallestChange: Position = smallestSigned(change);
  const targetScroll: Position = add(current, smallestChange);

  if (isEqual(targetScroll, origin)) {
    return false;
  }

  console.group('canScroll?');
  console.log('smallest change', smallestChange);
  console.log('current', current);
  console.log('target', targetScroll);
  console.log('max', max);
  console.groupEnd();

  if (isTooFarBack(targetScroll)) {
    console.log('too far back', { targetScroll });
    return false;
  }

  if (isTooFarForward(targetScroll, max)) {
    console.log('too far forward', { targetScroll, max });
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

  console.warn('can scroll droppable?');

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
  const target: Position = apply((value: number) =>
    (value > 0 ? Math.floor(value) : Math.ceil(value))
  )(change);

  if (isTooFarBack(target)) {
    console.log('backward overlap');
    return target;
  }

  if (isTooFarForward(target, max)) {
    const trimmedMax: Position = {
      x: target.x === 0 ? 0 : max.x,
      y: target.y === 0 ? 0 : max.y,
    };
    const overlap: Position = subtract(target, trimmedMax);
    console.log('forward overlap', target, overlap);
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

  console.warn('getting window overlap');
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

  console.log('getting droppable overlap');
  return getOverlap({
    current: closestScrollable.scroll.current,
    max: closestScrollable.scroll.max,
    change,
  });
};
