// @flow
import {
  createBox,
  getRect,
  withScroll,
  type Rect,
  type BoxModel,
  type Spacing,
  type Position,
} from 'css-box-model';
import { noMovement } from '../../src/state/no-impact';
import { vertical } from '../../src/state/axis';
import { noSpacing } from '../../src/state/spacing';
import { getDroppableDimension as getDroppable, type Closest } from '../../src/state/droppable-dimension';
import type {
  Axis,
  Placeholder,
  DragImpact,
  State,
  Scrollable,
  DraggableDescriptor,
  DroppableDescriptor,
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
} from '../../src/types';

type GetComputedSpacingArgs = {|
  margin?: Spacing,
  padding?: Spacing,
  border ?: Spacing,
  display?: string,
|}

export const getComputedSpacing = ({
  margin = noSpacing,
  padding = noSpacing,
  border = noSpacing,
  display = 'block',
}: GetComputedSpacingArgs): Object => ({
  paddingTop: `${padding.top}px`,
  paddingRight: `${padding.right}px`,
  paddingBottom: `${padding.bottom}px`,
  paddingLeft: `${padding.left}px`,
  marginTop: `${margin.top}px`,
  marginRight: `${margin.right}px`,
  marginBottom: `${margin.bottom}px`,
  marginLeft: `${margin.left}px`,
  borderTopWidth: `${border.top}px`,
  borderRightWidth: `${border.right}px`,
  borderBottomWidth: `${border.bottom}px`,
  borderLeftWidth: `${border.left}px`,
  display,
});

export const makeScrollable = (droppable: DroppableDimension, amount?: number = 20) => {
  const axis: Axis = droppable.axis;
  const borderBox: Rect = droppable.client.borderBox;

  const horizontalGrowth: number = axis === vertical ? 0 : amount;
  const verticalGrowth: number = axis === vertical ? amount : 0;

  // is 10px smaller than the client on the main axis
  // this will leave 10px of scrollable area.
  // only expanding on one axis
  const newBorderBox: Rect = getRect({
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

  const newClient: BoxModel = createBox({
    borderBox: newBorderBox,
    border: droppable.client.border,
    padding: droppable.client.padding,
    margin: droppable.client.margin,
  });

  // eslint-disable-next-line no-use-before-define
  const preset = getPreset();
  const newPage: BoxModel = withScroll(newClient, preset.windowScroll);

  return getDroppable({
    descriptor: droppable.descriptor,
    isEnabled: droppable.isEnabled,
    direction: axis.direction,
    client: newClient,
    page: newPage,
    closest: {
      // using old dimensions for frame
      client: droppable.client,
      page: droppable.page,
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
});

export const getClosestScrollable = (droppable: DroppableDimension): Scrollable => {
  if (!droppable.viewport.closestScrollable) {
    throw new Error('Cannot get closest scrollable');
  }
  return droppable.viewport.closestScrollable;
};

type GetDraggableArgs = {|
  descriptor: DraggableDescriptor,
  borderBox: Spacing,
  windowScroll?: Position,
  margin ?: Spacing,
  padding ?: Spacing,
  border?: Spacing,
|}

export const getDraggableDimension = ({
  descriptor,
  borderBox,
  windowScroll,
  margin,
  border,
  padding,
}: GetDraggableArgs): DraggableDimension => {
  const client: BoxModel = createBox({
    borderBox,
    margin,
    padding,
    border,
  });

  const result: DraggableDimension = {
    descriptor,
    client,
    page: withScroll(client, windowScroll),
    placeholder: getPlaceholder(client),
  };

  return result;
};

type ClosestSubset = {|
  borderBox: Spacing,
  margin?: Spacing,
  border?: Spacing,
  padding?: Spacing,
  scrollHeight: number,
  scrollWidth: number,
  scroll: Position,
  shouldClipSubject: boolean,
|}

type GetDroppableArgs = {|
  descriptor: DroppableDescriptor,
  borderBox: Spacing,
  direction?: 'vertical' | 'horizontal',
  margin ?: Spacing,
  border?: Spacing,
  padding?: Spacing,
  windowScroll?: Position,
  closest?: ?ClosestSubset,
  isEnabled?: boolean,
|}

export const getDroppableDimension = ({
  descriptor,
  borderBox,
  margin,
  padding,
  border,
  windowScroll,
  closest,
  isEnabled = true,
  direction = 'vertical',
}: GetDroppableArgs): DroppableDimension => {
  const client: BoxModel = createBox({
    borderBox,
    margin,
    padding,
    border,
  });
  const page: BoxModel = withScroll(client, windowScroll);

  const closestScrollable: ?Closest = (() => {
    if (!closest) {
      return null;
    }

    const frameClient: BoxModel = createBox({
      borderBox: closest.borderBox,
      border: closest.border,
      padding: closest.padding,
      margin: closest.margin,
    });

    const framePage: BoxModel = withScroll(frameClient, windowScroll);

    const result: Closest = {
      client: frameClient,
      page: framePage,
      scrollHeight: closest.scrollHeight,
      scrollWidth: closest.scrollWidth,
      scroll: closest.scroll,
      shouldClipSubject: closest.shouldClipSubject,
    };

    return result;
  })();

  return getDroppable({
    descriptor,
    isEnabled,
    direction,
    client,
    page,
    closest: closestScrollable,
  });
};

export const withAssortedSpacing = () => {
  const margin: Spacing = { top: 10, left: 10, bottom: 5, right: 5 };
  const padding: Spacing = { top: 2, left: 2, bottom: 2, right: 2 };
  const border: Spacing = { top: 1, left: 2, bottom: 3, right: 4 };

  return { margin, padding, border };
};

export const getPreset = (axis?: Axis = vertical) => {
  const windowScroll: Position = { x: 50, y: 100 };
  const crossAxisStart: number = 0;
  const crossAxisEnd: number = 100;
  const foreignCrossAxisStart: number = 100;
  const foreignCrossAxisEnd: number = 200;
  const emptyForeignCrossAxisStart: number = 200;
  const emptyForeignCrossAxisEnd: number = 300;

  const home: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: 'home',
      type: 'TYPE',
    },
    borderBox: {
      // would be 0 but pushed forward by margin
      [axis.start]: 10,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 200,
    },
    ...withAssortedSpacing(),
    windowScroll,
    direction: axis.direction,
  });

  const foreign: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: 'foreign',
      type: 'TYPE',
    },
    borderBox: {
      [axis.start]: 10,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 200,
    },
    ...withAssortedSpacing(),
    windowScroll,
    direction: axis.direction,
  });

  const emptyForeign: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: 'empty-foreign',
      type: 'TYPE',
    },
    borderBox: {
      // would be 0 but pushed forward by margin
      [axis.start]: 10,
      [axis.crossAxisStart]: emptyForeignCrossAxisStart,
      [axis.crossAxisEnd]: emptyForeignCrossAxisEnd,
      [axis.end]: 200,
    },
    ...withAssortedSpacing(),
    windowScroll,
    direction: axis.direction,
  });

  const inHome1: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inhome1',
      droppableId: home.descriptor.id,
      index: 0,
    },
    borderBox: {
      // starting at start of home
      [axis.start]: 10,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 20,
    },
    windowScroll,
    ...withAssortedSpacing(),
  });
    // size: 20
  const inHome2: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inhome2',
      droppableId: home.descriptor.id,
      index: 1,
    },
    // pushed forward by margin of inHome1
    borderBox: {
      [axis.start]: 30,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 50,
    },
    ...withAssortedSpacing(),
    windowScroll,
  });
  // size: 30
  const inHome3: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inhome3',
      droppableId: home.descriptor.id,
      index: 2,
    },
    borderBox: {
      [axis.start]: 60,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 90,
    },
    ...withAssortedSpacing(),
    windowScroll,
  });
    // size: 40
  const inHome4: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inhome4',
      droppableId: home.descriptor.id,
      index: 3,
    },
    borderBox: {
      [axis.start]: 100,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
      [axis.end]: 140,
    },
    ...withAssortedSpacing(),
    windowScroll,
  });

    // size: 10
  const inForeign1: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inForeign1',
      droppableId: foreign.descriptor.id,
      index: 0,
    },
    borderBox: {
      [axis.start]: 10,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 20,
    },
    ...withAssortedSpacing(),
    windowScroll,
  });
  // size: 20
  const inForeign2: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inForeign2',
      droppableId: foreign.descriptor.id,
      index: 1,
    },
    borderBox: {
      [axis.start]: 30,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 50,
    },
    ...withAssortedSpacing(),
    windowScroll,
  });
  // size: 30
  const inForeign3: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inForeign3',
      droppableId: foreign.descriptor.id,
      index: 2,
    },
    borderBox: {
      [axis.start]: 60,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 90,
    },
    ...withAssortedSpacing(),
    windowScroll,
  });
  // size: 40
  const inForeign4: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inForeign4',
      droppableId: foreign.descriptor.id,
      index: 3,
    },
    borderBox: {
      [axis.start]: 100,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 140,
    },
    ...withAssortedSpacing(),
    windowScroll,
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

export const disableDroppable = (droppable: DroppableDimension): DroppableDimension => ({
  ...droppable,
  isEnabled: false,
});
