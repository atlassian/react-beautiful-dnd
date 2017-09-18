// @flow
import getClientRect from '../../src/state/get-client-rect';
import { getDroppableDimension, getDraggableDimension } from '../../src/state/dimension';
import { add } from '../../src/state/position';
import type {
  Axis,
  Position,
  Spacing,
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
} from '../../src/types';

export const getPreset = (axis: Axis) => {
  const margin: Spacing = { top: 10, left: 10, bottom: 5, right: 5 };
  const padding: Spacing = { top: 2, left: 2, bottom: 2, right: 2 };
  const windowScroll: Position = { x: 50, y: 100 };
  const crossAxisStart: number = 0;
  const crossAxisEnd: number = 100;
  const foreignCrossAxisStart: number = 100;
  const foreignCrossAxisEnd: number = 200;
  const emptyForeignCrossAxisStart: number = 200;
  const emptyForeignCrossAxisEnd: number = 300;

  const home: DroppableDimension = getDroppableDimension({
    id: 'home',
    direction: axis.direction,
    padding,
    margin,
    windowScroll,
    clientRect: getClientRect({
      // would be 0 but pushed forward by margin
      [axis.start]: 10,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 200,
    }),
  });

  const foreign: DroppableDimension = getDroppableDimension({
    id: 'foreign',
    padding,
    margin,
    windowScroll,
    direction: axis.direction,
    clientRect: getClientRect({
      // would be 0 but pushed forward by margin
      [axis.start]: 10,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 200,
    }),
  });

  const emptyForeign: DroppableDimension = getDroppableDimension({
    id: 'empty-foreign',
    padding,
    margin,
    windowScroll,
    direction: axis.direction,
    clientRect: getClientRect({
      // would be 0 but pushed forward by margin
      [axis.start]: 10,
      [axis.crossAxisStart]: emptyForeignCrossAxisStart,
      [axis.crossAxisEnd]: emptyForeignCrossAxisEnd,
      [axis.end]: 200,
    }),
  });

  // size: 10
  const inHome1: DraggableDimension = getDraggableDimension({
    id: 'inhome1',
    droppableId: home.id,
    margin,
    windowScroll,
    clientRect: getClientRect({
      // starting at start of home
      [axis.start]: 10,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 20,
    }),
  });
  // size: 20
  const inHome2: DraggableDimension = getDraggableDimension({
    id: 'inhome2',
    droppableId: home.id,
    // pushed forward by margin of inHome1
    margin,
    windowScroll,
    clientRect: getClientRect({
      [axis.start]: 30,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 50,
    }),
  });
  // size: 30
  const inHome3: DraggableDimension = getDraggableDimension({
    id: 'inhome3',
    droppableId: home.id,
    margin,
    windowScroll,
    // pushed forward by margin of inHome2
    clientRect: getClientRect({
      [axis.start]: 60,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 90,
    }),
  });
  // size: 40
  const inHome4: DraggableDimension = getDraggableDimension({
    id: 'inhome4',
    droppableId: home.id,
    // pushed forward by margin of inHome3
    margin,
    windowScroll,
    clientRect: getClientRect({
      [axis.start]: 100,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 140,
    }),
  });

  // size: 10
  const inForeign1: DraggableDimension = getDraggableDimension({
    id: 'inForeign1',
    droppableId: foreign.id,
    margin,
    windowScroll,
    clientRect: getClientRect({
      [axis.start]: 10,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 20,
    }),
  });
  // size: 20
  const inForeign2: DraggableDimension = getDraggableDimension({
    id: 'inForeign2',
    droppableId: foreign.id,
    // pushed forward by margin of inForeign1
    margin,
    windowScroll,
    clientRect: getClientRect({
      [axis.start]: 30,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 50,
    }),
  });
  // size: 30
  const inForeign3: DraggableDimension = getDraggableDimension({
    id: 'inForeign3',
    droppableId: foreign.id,
    margin,
    windowScroll,
    // pushed forward by margin of inForeign2
    clientRect: getClientRect({
      [axis.start]: 60,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 90,
    }),
  });
  // size: 40
  const inForeign4: DraggableDimension = getDraggableDimension({
    id: 'inForeign4',
    droppableId: foreign.id,
    margin,
    windowScroll,
    // pushed forward by margin of inForeign3
    clientRect: getClientRect({
      [axis.start]: 100,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 140,
    }),
  });

  const droppables: DroppableDimensionMap = {
    [home.id]: home,
    [foreign.id]: foreign,
    [emptyForeign.id]: emptyForeign,
  };

  const draggables: DraggableDimensionMap = {
    [inHome1.id]: inHome1,
    [inHome2.id]: inHome2,
    [inHome3.id]: inHome3,
    [inHome4.id]: inHome4,
    [inForeign1.id]: inForeign1,
    [inForeign2.id]: inForeign2,
    [inForeign3.id]: inForeign3,
    [inForeign4.id]: inForeign4,
  };

  return {
    home,
    inHome1,
    inHome2,
    inHome3,
    inHome4,
    foreign,
    inForeign1,
    inForeign2,
    inForeign3,
    inForeign4,
    emptyForeign,
    droppables,
    draggables,
  };
};

export const updateDroppableScroll = (
  droppable: DroppableDimension,
  addition: Position
): DroppableDimension => {
  const newScroll = add(droppable.scroll.initial, addition);

  const result: DroppableDimension = {
    id: droppable.id,
    axis: droppable.axis,
    isEnabled: droppable.isEnabled,
    scroll: {
      initial: droppable.scroll.initial,
      current: newScroll,
    },
    client: droppable.client,
    page: droppable.page,
  };

  return result;
};

export const disableDroppable = (droppable: DroppableDimension): DroppableDimension => ({
  id: droppable.id,
  axis: droppable.axis,
  isEnabled: false,
  scroll: droppable.scroll,
  client: droppable.client,
  page: droppable.page,
});
