// @flow
import rafSchd from 'raf-schd';
import getViewport from '../visibility/get-viewport';
import { isEqual } from '../position';
import { vertical, horizontal } from '../axis';
import getDroppableFrameOver from './get-droppable-frame-over';
import scrollWindow, { canScroll as canScrollWindow } from './scroll-window';
import type { AutoScrollMarshal } from './auto-scroll-marshal-types';
import type {
  Area,
  Axis,
  DroppableId,
  DragState,
  DroppableDimension,
  Position,
  State,
  Spacing,
} from '../../types';

type Args = {|
  scrollDroppable: (id: DroppableId, change: Position) => void,
|}

export const config = {
  // percentage distance from edge of container:
  startFrom: 0.18,
  maxSpeedAt: 0.05,
  // pixels per frame
  maxScrollSpeed: 25,
};

const origin: Position = { x: 0, y: 0 };

type Thresholds = {|
  startFrom: number,
  maxSpeedAt: number,
  accelerationPlane: number,
|}

const getThresholds = (container: Area, axis: Axis): Thresholds => {
  const startFrom: number = container[axis.size] * config.startFrom;
  const maxSpeedAt: number = container[axis.size] * config.maxSpeedAt;
  const accelerationPlane: number = startFrom - maxSpeedAt;

  const thresholds: Thresholds = {
    startFrom,
    maxSpeedAt,
    accelerationPlane,
  };

  return thresholds;
};

const getSpeed = (distance: number, thresholds: Thresholds): number => {
  // Not close enough to the edge
  if (distance >= thresholds.startFrom) {
    return 0;
  }

  // gone past the edge (currently not supported)
  // TODO: do not want for window - but need it for droppable?
  // if (distance < 0) {
  //   return 0;
  // }

  // Already past the maxSpeedAt point

  if (distance <= thresholds.maxSpeedAt) {
    return config.maxScrollSpeed;
  }

  // We need to perform a scroll as a percentage of the max scroll speed

  const distancePastStart: number = thresholds.startFrom - distance;
  const percentage: number = distancePastStart / thresholds.accelerationPlane;
  const speed: number = config.maxScrollSpeed * percentage;

  return speed;
};

// returns null if no scroll is required
const getRequiredScroll = (container: Area, center: Position): ?Position => {
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
    const thresholds: Thresholds = getThresholds(container, vertical);
    const isCloserToBottom: boolean = distance.bottom < distance.top;

    if (isCloserToBottom) {
      return getSpeed(distance.bottom, thresholds);
    }

    // closer to top
    return -1 * getSpeed(distance.top, thresholds);
  })();

  const x: number = (() => {
    const thresholds: Thresholds = getThresholds(container, horizontal);
    const isCloserToRight: boolean = distance.right < distance.left;

    if (isCloserToRight) {
      return getSpeed(distance.right, thresholds);
    }

    // closer to left
    return -1 * getSpeed(distance.left, thresholds);
  })();

  const scroll: Position = { x, y };

  return isEqual(scroll, origin) ? null : scroll;
};

export default ({
  scrollDroppable,
}: Args): AutoScrollMarshal => {
  // TODO: do not scroll if drag has finished
  const scheduleWindowScroll = rafSchd(scrollWindow);
  const scheduleDroppableScroll = rafSchd(scrollDroppable);

  const onDrag = (state: State) => {
    if (state.phase !== 'DRAGGING') {
      console.error('Invalid phase for auto scrolling');
      return;
    }

    const drag: ?DragState = state.drag;

    if (!drag) {
      console.error('Invalid drag state');
      return;
    }

    const center: Position = drag.current.page.center;

    // Ideally we would

    // 1. Can we scroll the viewport?

    const viewport: Area = getViewport();
    const requiredWindowScroll: ?Position = getRequiredScroll(viewport, center);

    if (requiredWindowScroll && canScrollWindow(requiredWindowScroll)) {
      scheduleWindowScroll(requiredWindowScroll);
      return;
    }

    // 2. We are not scrolling the window. Can we scroll the Droppable?

    const droppable: ?DroppableDimension = getDroppableFrameOver({
      target: center,
      droppables: state.dimension.droppable,
    });

    if (!droppable) {
      return;
    }

    // not a scrollable droppable (should not occur)
    if (!droppable.viewport.frame) {
      return;
    }

    const requiredFrameScroll: ?Position =
      getRequiredScroll(droppable.viewport.frame, center);

    if (!requiredFrameScroll) {
      return;
    }

    scheduleDroppableScroll(droppable.descriptor.id, requiredFrameScroll);
  };

  const onStateChange = (previous: State, current: State): void => {
    // now dragging
    if (current.phase === 'DRAGGING') {
      onDrag(current);
      return;
    }

    // cancel any pending scrolls if no longer dragging
    if (previous.phase === 'DRAGGING' && current.phase !== 'DRAGGING') {
      scheduleWindowScroll.cancel();
      scheduleDroppableScroll.cancel();
    }
  };

  const marshal: AutoScrollMarshal = {
    onStateChange,
  };

  return marshal;
};

