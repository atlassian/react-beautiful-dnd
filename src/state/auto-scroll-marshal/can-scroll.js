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
  proposed: Position,
|}

const origin: Position = { x: 0, y: 0 };

const getSmallestSignedValue = (value: number) => {
  if (value === 0) {
    return 0;
  }
  return value > 0 ? 1 : -1;
};

const canScroll = ({
  max,
  current,
  proposed,
}: CanScrollArgs): boolean => {
  // Only need to be able to move the smallest amount in the desired direction
  const smallestChange: Position = {
    x: getSmallestSignedValue(proposed.x),
    y: getSmallestSignedValue(proposed.y),
  };

  const target: Position = add(current, smallestChange);

  if (isEqual(target, origin)) {
    return false;
  }

  // Too far back
  if (target.y <= 0 && target.x <= 0) {
    return false;
  }

  // Too far forward
  if (target.y >= max.y && target.x >= max.x) {
    return false;
  }

  return true;
};

export const canScrollWindow = (change: Position): boolean => {
  const el: ?HTMLElement = document.documentElement;

  if (!el) {
    console.error('Cannot find document element');
    return false;
  }

  const current: Position = getWindowScrollPosition();
  const viewport: Area = getViewport();

  const maxScroll: Position = getMaxScroll({
    scrollHeight: el.scrollHeight,
    scrollWidth: el.scrollWidth,
    width: viewport.width,
    height: viewport.height,
  });

  console.log('can scroll window?');

  return canScroll({
    current,
    max: maxScroll,
    proposed: change,
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

  console.log('can scroll droppable?');

  return canScroll({
    current: closestScrollable.scroll.current,
    max: closestScrollable.scroll.max,
    proposed: change,
  });
};
