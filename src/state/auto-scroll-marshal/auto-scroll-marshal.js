// @flow
import rafSchd from 'raf-schd';
import getViewport from '../visibility/get-viewport';
import { isEqual } from '../position';
import type { AutoScrollMarshal } from './auto-scroll-marshal-types';
import type {
  Area,
  DroppableId,
  DragState,
  DraggableDimension,
  DroppableDimension,
  Position,
  State,
  Spacing,
} from '../../types';

type Args = {|
  getClosestScrollable: (id: DroppableId) => ?HTMLElement
|}

export const config = {
  // TODO: should these percentages of the container size?
  distanceToEdgeToStartScrolling: 300,
  distanceToEdgeForMaxSpeed: 100,
  // pixels per frame
  maxScrollSpeed: 30,
};

const origin: Position = { x: 0, y: 0 };

const getSpeed = (distance: number): number => {
  if (distance > config.distanceToEdgeToStartScrolling) {
    return 0;
  }

  // Okay, we need to scroll

  const scrollPlane: number = config.distanceToEdgeToStartScrolling - config.distanceToEdgeForMaxSpeed;

  // need to figure out the difference form the current position
  const diff: number = config.distanceToEdgeToStartScrolling - distance;

  // going below the scroll plane
  if (diff >= scrollPlane) {
    console.log('using max scroll speed');
    return config.maxScrollSpeed;
  }

  const percentage: number = diff / scrollPlane;
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

  const vertical: number = (() => {
    const isCloserToBottom: boolean = distance.bottom < distance.top;

    if (isCloserToBottom) {
      return getSpeed(distance.bottom);
    }

    // closer to top
    return -1 * getSpeed(distance.top);
  })();

  const horizontal: number = (() => {
    const isCloserToRight: boolean = distance.right < distance.left;

    if (isCloserToRight) {
      return getSpeed(distance.right);
    }

    // closer to left
    return -1 * getSpeed(distance.left);
  })();

  const scroll: Position = { x: horizontal, y: vertical };

  return isEqual(scroll, origin) ? null : scroll;
};

export default (): AutoScrollMarshal => {
  // TODO: do not scroll if drag has finished
  const scheduleScroll = rafSchd((change: Position) => {
    console.log('scrolling window', change);
    // TODO: check if can actually scroll this much
    window.scrollBy(change.x, change.y);
  });

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

    // const descriptor: DraggableDescriptor = drag.initial.descriptor;
    const center: Position = drag.current.page.center;
    // const draggable: DraggableDimension = state.dimension.draggable[descriptor.id];
    // const droppable: DroppableDimension = state.dimension.droppable[descriptor.droppableId];

    // TODO: droppable scroll

    const viewport: Area = getViewport();

    const requiredScroll: ?Position = getRequiredScroll(viewport, center);

    if (!requiredScroll) {
      return;
    }

    scheduleScroll(requiredScroll);

    // const bottomDiff = viewport.bottom - center.y;
    // const topDiff = center.y - viewport.top;

    // console.log('top diff', topDiff);

    // if (bottomDiff < 100) {
    //   scheduleScroll({ x: 0, y: 20 });
    //   return;
    // }

    // if (topDiff < 100) {
    //   scheduleScroll({ x: 0, y: -20 });
    // }
  };

  const onStateChange = (previous: State, current: State): void => {
    // now dragging
    if (current.phase === 'DRAGGING') {
      onDrag(current);
      return;
    }

    // cancel any pending scrolls if no longer dragging
    if (previous.phase === 'DRAGGING' && current.phase !== 'DRAGGING') {
      scheduleScroll.cancel();
    }
  };

  const marshal: AutoScrollMarshal = {
    onStateChange,
  };

  return marshal;
};

