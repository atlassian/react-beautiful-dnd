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

// returns null if no scroll is required
const getRequiredScroll = (container: Area, center: Position): ?Position => {
  // get distance to each edge
  const distance: Spacing = {
    top: center.y - container.top,
    right: container.right - center.x,
    bottom: container.bottom - center.y,
    left: center.x - container.left,
  };

  console.log(distance);

  return { x: 0, y: 0 };
};

export default (): AutoScrollMarshal => {
  // TODO: do not scroll if drag has finished
  const scheduleScroll = rafSchd((change: Position) => {
    console.log('scrolling window');
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

  const marshal: AutoScrollMarshal = {
    onDrag,
  };

  return marshal;
};

