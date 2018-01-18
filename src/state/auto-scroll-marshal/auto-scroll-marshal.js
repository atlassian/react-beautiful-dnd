// @flow
import rafSchd from 'raf-schd';
import getViewport from '../visibility/get-viewport';
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
  // pixels from the edge of a container for when an auto scroll starts
  distanceToEdgeToStartScrolling: 250,
  distanceToEdgeForMaxSpeed: 80,
  // pixels per frame
  maxScrollSpeed: 10,
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

  // const vertical: number = (() => {

  // })();

  // const horizontal: number = (() => {

  // });

  // return { x: horizontal, y: vertical }

  // small enough distance to start drag
  if (distance.bottom < config.distanceToEdgeToStartScrolling) {
    // the smaller the distance - the closer we move to the max scroll speed
    // if we go into the negative distance - then we use the max scroll speed

    const scrollPlane: number = config.distanceToEdgeToStartScrolling - config.distanceToEdgeForMaxSpeed;


    // need to figure out the difference form the current position
    const diff: number = config.distanceToEdgeToStartScrolling - distance.bottom;

    console.log('diff', diff);

    // going below the scroll plane
    if (diff >= scrollPlane) {
      console.log('using max scroll speed');
      return { x: 0, y: config.maxScrollSpeed };
    }

    const percentage: number = diff / scrollPlane;
    const speed: number = config.maxScrollSpeed * percentage;
    console.log('percentage', percentage);

    // console.log({
    //   bottomDistance: distance.bottom,
    //   withBUffer: distance.bottom - config.distanceToEdgeForMaxSpeed,
    //   diff,
    //   diffBeforeCutoff: config.startDistance - config.distanceToEdgeForMaxSpeed,
    // })



    // const percentage: number = diff / config.startDistance;
    // const speed: number = config.maxScrollSpeed * percentage;

    return { x: 0, y: speed };
  }


  return null;
};

export default (): AutoScrollMarshal => {
  // TODO: do not scroll if drag has finished
  const scheduleScroll = rafSchd((change: Position) => {
    console.log('scrolling window', change);
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

