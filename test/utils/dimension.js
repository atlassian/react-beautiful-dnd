// @flow
import getArea from '../../src/state/get-area';
import { noMovement } from '../../src/state/no-impact';
import { getDroppableDimension, getDraggableDimension } from '../../src/state/dimension';
import { vertical } from '../../src/state/axis';
import type {
  Area,
  Axis,
  DragImpact,
  State,
  Position,
  ClosestScrollable,
  Spacing,
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
} from '../../src/types';

const margin: Spacing = { top: 10, left: 10, bottom: 5, right: 5 };
const padding: Spacing = { top: 2, left: 2, bottom: 2, right: 2 };
const windowScroll: Position = { x: 50, y: 100 };
const crossAxisStart: number = 0;
const crossAxisEnd: number = 100;
const foreignCrossAxisStart: number = 100;
const foreignCrossAxisEnd: number = 200;
const emptyForeignCrossAxisStart: number = 200;
const emptyForeignCrossAxisEnd: number = 300;

export const makeScrollable = (droppable: DroppableDimension, amount?: number = 20) => {
  const axis: Axis = droppable.axis;
  const paddingBox: Area = droppable.client.paddingBox;

  const horizontalGrowth: number = axis === vertical ? 0 : amount;
  const verticalGrowth: number = axis === vertical ? amount : 0;

  // is 10px smaller than the client on the main axis
  // this will leave 10px of scrollable area.
  // only expanding on one axis
  const newPaddingBox: Area = getArea({
    top: paddingBox.top,
    left: paddingBox.left,
    // growing the client to account for the scrollable area
    right: paddingBox.right + horizontalGrowth,
    bottom: paddingBox.bottom + verticalGrowth,
  });

  // add scroll space on the main axis
  const scrollSize = {
    width: paddingBox.width + horizontalGrowth,
    height: paddingBox.height + verticalGrowth,
  };

  return getDroppableDimension({
    descriptor: droppable.descriptor,
    direction: axis.direction,
    padding,
    margin,
    windowScroll,
    paddingBox: newPaddingBox,
    closest: {
      frameClient: paddingBox,
      scrollWidth: scrollSize.width,
      scrollHeight: scrollSize.height,
      scroll: { x: 0, y: 0 },
      shouldClipSubject: true,
    },
  });
};

export const getInitialImpact = (draggable: DraggableDimension, axis?: Axis = vertical) => {
  const impact: DragImpact = {
    movement: noMovement,
    direction: axis.direction,
    destination: {
      index: draggable.descriptor.index,
      droppableId: draggable.descriptor.droppableId,
    },
  };
  return impact;
};

export const withImpact = (state: State, impact: DragImpact) => {
  // while dragging
  if (state.drag) {
    return {
      ...state,
      drag: {
        ...state.drag,
        impact,
      },
    };
  }
  // while drop animating
  if (state.drop && state.drop.pending) {
    return {
      ...state,
      drop: {
        ...state.drop,
        pending: {
          ...state.drop.pending,
          impact,
        },
      },
    };
  }

  throw new Error('unable to apply impact');
};

export const addDroppable = (base: State, droppable: DroppableDimension): State => ({
  ...base,
  dimension: {
    ...base.dimension,
    droppable: {
      ...base.dimension.droppable,
      [droppable.descriptor.id]: droppable,
    },
  },
});

export const addDraggable = (base: State, draggable: DraggableDimension): State => ({
  ...base,
  dimension: {
    ...base.dimension,
    draggable: {
      ...base.dimension.draggable,
      [draggable.descriptor.id]: draggable,
    },
  },
});

export const getClosestScrollable = (droppable: DroppableDimension): ClosestScrollable => {
  if (!droppable.viewport.closestScrollable) {
    throw new Error('Cannot get closest scrollable');
  }
  return droppable.viewport.closestScrollable;
};

export const getPreset = (axis?: Axis = vertical) => {
  const home: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: 'home',
      type: 'TYPE',
    },
    direction: axis.direction,
    padding,
    margin,
    windowScroll,
    paddingBox: getArea({
      // would be 0 but pushed forward by margin
      [axis.start]: 10,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 200,
    }),
  });

  const foreign: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: 'foreign',
      type: 'TYPE',
    },
    padding,
    margin,
    windowScroll,
    direction: axis.direction,
    paddingBox: getArea({
      // would be 0 but pushed forward by margin
      [axis.start]: 10,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 200,
    }),
  });

  const emptyForeign: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: 'empty-foreign',
      type: 'TYPE',
    },
    padding,
    margin,
    windowScroll,
    direction: axis.direction,
    paddingBox: getArea({
      // would be 0 but pushed forward by margin
      [axis.start]: 10,
      [axis.crossAxisStart]: emptyForeignCrossAxisStart,
      [axis.crossAxisEnd]: emptyForeignCrossAxisEnd,
      [axis.end]: 200,
    }),
  });

  // size: 10
  const inHome1: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inhome1',
      droppableId: home.descriptor.id,
      index: 0,
    },
    margin,
    windowScroll,
    paddingBox: getArea({
      // starting at start of home
      [axis.start]: 10,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 20,
    }),
  });
  // size: 20
  const inHome2: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inhome2',
      droppableId: home.descriptor.id,
      index: 1,
    },
    // pushed forward by margin of inHome1
    margin,
    windowScroll,
    paddingBox: getArea({
      [axis.start]: 30,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 50,
    }),
  });
  // size: 30
  const inHome3: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inhome3',
      droppableId: home.descriptor.id,
      index: 2,
    },
    margin,
    windowScroll,
    // pushed forward by margin of inHome2
    paddingBox: getArea({
      [axis.start]: 60,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 90,
    }),
  });
  // size: 40
  const inHome4: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inhome4',
      droppableId: home.descriptor.id,
      index: 3,
    },
    // pushed forward by margin of inHome3
    margin,
    windowScroll,
    paddingBox: getArea({
      [axis.start]: 100,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 140,
    }),
  });

  // size: 10
  const inForeign1: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inForeign1',
      droppableId: foreign.descriptor.id,
      index: 0,
    },
    margin,
    windowScroll,
    paddingBox: getArea({
      [axis.start]: 10,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 20,
    }),
  });
  // size: 20
  const inForeign2: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inForeign2',
      droppableId: foreign.descriptor.id,
      index: 1,
    },
    // pushed forward by margin of inForeign1
    margin,
    windowScroll,
    paddingBox: getArea({
      [axis.start]: 30,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 50,
    }),
  });
  // size: 30
  const inForeign3: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inForeign3',
      droppableId: foreign.descriptor.id,
      index: 2,
    },
    margin,
    windowScroll,
    // pushed forward by margin of inForeign2
    paddingBox: getArea({
      [axis.start]: 60,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 90,
    }),
  });
  // size: 40
  const inForeign4: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inForeign4',
      droppableId: foreign.descriptor.id,
      index: 3,
    },
    margin,
    windowScroll,
    // pushed forward by margin of inForeign3
    paddingBox: getArea({
      [axis.start]: 100,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 140,
    }),
  });

  const droppables: DroppableDimensionMap = {
    [home.descriptor.id]: home,
    [foreign.descriptor.id]: foreign,
    [emptyForeign.descriptor.id]: emptyForeign,
  };

  const draggables: DraggableDimensionMap = {
    [inHome1.descriptor.id]: inHome1,
    [inHome2.descriptor.id]: inHome2,
    [inHome3.descriptor.id]: inHome3,
    [inHome4.descriptor.id]: inHome4,
    [inForeign1.descriptor.id]: inForeign1,
    [inForeign2.descriptor.id]: inForeign2,
    [inForeign3.descriptor.id]: inForeign3,
    [inForeign4.descriptor.id]: inForeign4,
  };

  const inHomeList: DraggableDimension[] = [
    inHome1, inHome2, inHome3, inHome4,
  ];

  const inForeignList: DraggableDimension[] = [
    inForeign1, inForeign2, inForeign3, inForeign4,
  ];

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
    inHomeList,
    inForeignList,
    windowScroll,
  };
};

// $ExpectError - using spread
export const disableDroppable = (droppable: DroppableDimension): DroppableDimension => ({
  ...droppable,
  isEnabled: false,
});
