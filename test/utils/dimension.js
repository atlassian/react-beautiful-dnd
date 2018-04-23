// @flow
import {
  createBox,
  getRect,
  withScroll,
  type Rect,
  type BoxModel,
} from 'css-box-model';
import { noMovement } from '../../src/state/no-impact';
import { vertical } from '../../src/state/axis';
import type {
  Axis,
  Placeholder,
  DragImpact,
  State,
  Position,
  Scrollable,
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
  const borderBox: Rect = droppable.client.borderBox;

  const horizontalGrowth: number = axis === vertical ? 0 : amount;
  const verticalGrowth: number = axis === vertical ? amount : 0;

  // is 10px smaller than the client on the main axis
  // this will leave 10px of scrollable area.
  // only expanding on one axis
  const newPaddingBox: Rect = getRect({
    top: borderBox.top,
    left: borderBox.left,
    // growing the client to account for the scrollable area
    right: borderBox.right + horizontalGrowth,
    bottom: borderBox.bottom + verticalGrowth,
  });

  // add scroll space on the main axis
  const scrollSize = {
    width: borderBox.width + horizontalGrowth,
    height: borderBox.height + verticalGrowth,
  };

  // TODO
  return getDroppableDimension({
    descriptor: droppable.descriptor,
    direction: axis.direction,
    padding,
    margin,
    windowScroll,
    borderBox: newPaddingBox,
    closest: {
      frameBorderBox: borderBox,
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

const getPlaceholder = (client: BoxModel): Placeholder => ({
  client,
  tagName: 'div',
  display: 'block',
})

export const getClosestScrollable = (droppable: DroppableDimension): Scrollable => {
  if (!droppable.viewport.closestScrollable) {
    throw new Error('Cannot get closest scrollable');
  }
  return droppable.viewport.closestScrollable;
};

export const getPreset = (axis?: Axis = vertical) => {
  const homeBox: BoxModel = createBox({
    borderBox: getRect({
      // would be 0 but pushed forward by margin
      [axis.start]: 10,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 200,
    }),
    margin,
    padding,
  });
  const home: DroppableDimension = {
    descriptor: {
      id: 'home',
      type: 'TYPE',
    },
    axis,
    isEnabled: true,
    client: homeBox,
    page: withScroll(homeBox, windowScroll),
    viewport: {
      closestScrollable: null,
      clipped: null,
      subject: withScroll(homeBox, windowScroll).borderBox,
    }
  };

  const foreignBox: BoxModel = createBox({
    borderBox: getRect({
      // would be 0 but pushed forward by margin
      [axis.start]: 10,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 200,
    }),
    padding,
    margin,
  });

  const foreign: DroppableDimension = {
    descriptor: {
      id: 'foreign',
      type: 'TYPE',
    },
    axis,
    isEnabled: true,
    client: foreignBox,
    page: withScroll(foreignBox, windowScroll),
    viewport: {
      closestScrollable: null,
      clipped: null,
      subject: withScroll(foreignBox, windowScroll).borderBox,
    },
  };

  const emptyBox: BoxModel = createBox({
    borderBox: getRect({
      // would be 0 but pushed forward by margin
      [axis.start]: 10,
      [axis.crossAxisStart]: emptyForeignCrossAxisStart,
      [axis.crossAxisEnd]: emptyForeignCrossAxisEnd,
      [axis.end]: 200,
    }),
    padding,
    margin,
  });

  const emptyForeign: DroppableDimension = {
    descriptor: {
      id: 'empty-foreign',
      type: 'TYPE',
    },
    axis,
    isEnabled: true,
    client: emptyBox,
    page: withScroll(emptyBox, windowScroll),
    viewport: {
      closestScrollable: null,
      clipped: null,
      subject: withScroll(emptyBox, windowScroll).borderBox,
    },
  };

  // size: 10
  const inHome1Box: BoxModel = createBox({
    borderBox: getRect({
      // starting at start of home
      [axis.start]: 10,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 20,
    }),
    margin,
  });

  const inHome1: DraggableDimension = {
    descriptor: {
      id: 'inhome1',
      droppableId: home.descriptor.id,
      index: 0,
    },
    client: inHome1Box,
    page: withScroll(inHome1Box, windowScroll),
    placeholder: getPlaceholder(inHome1Box),
  };
  // size: 20
  const inHome2Box: BoxModel = createBox({
    borderBox: getRect({
      [axis.start]: 30,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 50,
    }),
    margin,
  });
  const inHome2: DraggableDimension = {
    descriptor: {
      id: 'inhome2',
      droppableId: home.descriptor.id,
      index: 1,
    },
    // pushed forward by margin of inHome1
    client: inHome2Box,
    page: withScroll(inHome2Box, windowScroll),
    placeholder: getPlaceholder(inHome2Box),
  };
  // size: 30
  const inHome3Box: BoxModel = createBox({
    borderBox: getRect({
      [axis.start]: 60,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 90,
    }),
    margin,
  });
  const inHome3: DraggableDimension = {
    descriptor: {
      id: 'inhome3',
      droppableId: home.descriptor.id,
      index: 2,
    },
    client: inHome3Box,
    page: withScroll(inHome3Box, windowScroll),
    placeholder: getPlaceholder(inHome3Box),
  };
  // size: 40
  const inHome4Box: BoxModel = createBox({
    borderBox: getRect({
      [axis.start]: 100,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 140,
    }),
    margin,
  });
  const inHome4: DraggableDimension = {
    descriptor: {
      id: 'inhome4',
      droppableId: home.descriptor.id,
      index: 3,
    },
    // pushed forward by margin of inHome3
    client: inHome4Box,
    page: withScroll(inHome4Box, windowScroll),
    placeholder: getPlaceholder(inHome4Box),
  };

  // size: 10
  const inForeign1Box: BoxModel = createBox({
    borderBox: getRect({
      [axis.start]: 10,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 20,
    }),
    margin,
  });
  const inForeign1: DraggableDimension = {
    descriptor: {
      id: 'inForeign1',
      droppableId: foreign.descriptor.id,
      index: 0,
    },
    client: inForeign1Box,
    page: withScroll(inForeign1Box, windowScroll),
    placeholder: getPlaceholder(inForeign1Box),
  };
  // size: 20
  const inForeign2Box: BoxModel = createBox({
    borderBox: getRect({
      [axis.start]: 30,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 50,
    }),
    margin,
  });
  const inForeign2: DraggableDimension = {
    descriptor: {
      id: 'inForeign2',
      droppableId: foreign.descriptor.id,
      index: 1,
    },
    // pushed forward by margin of inForeign1
    client: inForeign2Box,
    page: withScroll(inForeign2Box, windowScroll),
    placeholder: getPlaceholder(inForeign2Box),
  };
  // size: 30
  const inForeign3Box: BoxModel = createBox({
    borderBox: getRect({
      [axis.start]: 60,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 90,
    }),
    margin,
  });
  const inForeign3: DraggableDimension = {
    descriptor: {
      id: 'inForeign3',
      droppableId: foreign.descriptor.id,
      index: 2,
    },
    client: inForeign3Box,
    page: withScroll(inForeign3Box, windowScroll),
    placeholder: getPlaceholder(inForeign3Box),
  };
  // size: 40
  const inForeign4Box: BoxModel = createBox({
    borderBox: getRect({
      [axis.start]: 100,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 140,
    }),
    margin,
  });
  const inForeign4: DraggableDimension = {
    descriptor: {
      id: 'inForeign4',
      droppableId: foreign.descriptor.id,
      index: 3,
    },
    client: inForeign4Box,
    page: withScroll(inForeign4Box, windowScroll),
    placeholder: getPlaceholder(inForeign4Box),
  };

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

export const disableDroppable = (droppable: DroppableDimension): DroppableDimension => ({
  ...droppable,
  isEnabled: false,
});
