// @flow
import invariant from 'tiny-invariant';
import {
  createBox,
  getRect,
  withScroll,
  type Rect,
  type BoxModel,
  type Spacing,
  type Position,
} from 'css-box-model';
import { vertical } from '../../src/state/axis';
import { noSpacing, offsetByPosition } from '../../src/state/spacing';
import getViewport from '../../src/view/window/get-viewport';
import scrollViewport from '../../src/state/scroll-viewport';
import getDroppable, {
  type Closest,
} from '../../src/state/droppable/get-droppable';
import {
  toDroppableMap,
  toDroppableList,
} from '../../src/state/dimension-structures';
import type {
  Axis,
  Placeholder,
  DraggableId,
  Viewport,
  Scrollable,
  DraggableDescriptor,
  DroppableDescriptor,
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DimensionMap,
  DraggingState,
  ScrollSize,
} from '../../src/types';
import isTotallyVisibleThroughFrame from '../../src/state/visibility/is-totally-visible-through-frame';
import patchDroppableMap from '../../src/state/patch-droppable-map';

type GetComputedSpacingArgs = {|
  margin?: Spacing,
  padding?: Spacing,
  border?: Spacing,
  display?: string,
|};

const origin: Position = { x: 0, y: 0 };

export const getFrame = (droppable: DroppableDimension): Scrollable => {
  invariant(droppable.frame);
  return droppable.frame;
};

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

export const makeScrollable = (
  droppable: DroppableDimension,
  amount?: number = 20,
) => {
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
  const scrollSize: ScrollSize = {
    scrollWidth: borderBox.width + horizontalGrowth,
    scrollHeight: borderBox.height + verticalGrowth,
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
    isCombineEnabled: droppable.isCombineEnabled,
    isFixedOnPage: droppable.isFixedOnPage,
    closest: {
      // using old dimensions for frame
      client: droppable.client,
      page: droppable.page,
      scrollSize,
      scroll: origin,
      shouldClipSubject: true,
    },
  });
};

export const addDroppable = (
  base: DraggingState,
  droppable: DroppableDimension,
): DraggingState => ({
  ...base,
  dimensions: {
    draggables: base.dimensions.draggables,
    droppables: patchDroppableMap(base.dimensions.droppables, droppable),
  },
});

export const addDraggable = (
  state: DraggingState,
  draggable: DraggableDimension,
): DraggingState => ({
  ...state,
  dimensions: {
    ...state.dimensions,
    draggables: {
      ...state.dimensions.draggables,
      [draggable.descriptor.id]: draggable,
    },
  },
});

const getPlaceholder = (client: BoxModel): Placeholder => ({
  client,
  tagName: 'div',
  display: 'block',
});

type GetDraggableArgs = {|
  descriptor: DraggableDescriptor,
  borderBox: Spacing,
  windowScroll?: Position,
  margin?: Spacing,
  padding?: Spacing,
  border?: Spacing,
|};

export const getDraggableDimension = ({
  descriptor,
  borderBox,
  windowScroll = origin,
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
  const displaceBy: Position = {
    x: client.marginBox.width,
    y: client.marginBox.height,
  };

  const result: DraggableDimension = {
    descriptor,
    client,
    page: withScroll(client, windowScroll),
    placeholder: getPlaceholder(client),
    displaceBy,
  };

  return result;
};

type ClosestMaker = {|
  borderBox: Spacing,
  margin?: Spacing,
  border?: Spacing,
  padding?: Spacing,
  scrollSize: ScrollSize,
  scroll: Position,
  shouldClipSubject: boolean,
|};

type GetDroppableArgs = {|
  descriptor: DroppableDescriptor,
  borderBox: Spacing,
  direction?: 'vertical' | 'horizontal',
  margin?: Spacing,
  border?: Spacing,
  padding?: Spacing,
  windowScroll?: Position,
  closest?: ?ClosestMaker,
  isEnabled?: boolean,
  isFixedOnPage?: boolean,
  isCombineEnabled?: boolean,
|};

export const getDroppableDimension = ({
  descriptor,
  borderBox,
  margin,
  padding,
  border,
  windowScroll = origin,
  closest,
  isEnabled = true,
  direction = 'vertical',
  isFixedOnPage = false,
  isCombineEnabled = false,
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
      scrollSize: closest.scrollSize,
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
    isCombineEnabled,
    isFixedOnPage,
  });
};

export const withAssortedSpacing = () => {
  const margin: Spacing = { top: 10, left: 10, bottom: 5, right: 5 };
  const padding: Spacing = { top: 2, left: 2, bottom: 2, right: 2 };
  const border: Spacing = { top: 1, left: 2, bottom: 3, right: 4 };

  return { margin, padding, border };
};

const validateIsInDroppable = (
  inList: DraggableDimension[],
  droppable: DroppableDimension,
) => {
  inList.forEach((item: DraggableDimension) => {
    invariant(
      isTotallyVisibleThroughFrame(droppable.client.borderBox)(
        item.client.marginBox,
      ),
      `
      draggable: "${item.descriptor.id}"
      margin box must be within
      droppable: "${droppable.descriptor.id}"
      border box
    `,
    );
  });
};

const validateIsStacked = (
  inList: DraggableDimension[],
  droppable: DroppableDimension,
) => {
  inList.forEach((item: DraggableDimension, index: number) => {
    // ignore first
    if (index === 0) {
      return;
    }
    const axis: Axis = droppable.axis;
    const before: DraggableDimension = inList[index - 1];

    const startOfItem: number = item.client.marginBox[axis.start];
    const endOfBefore: number = before.client.marginBox[axis.end];

    invariant(
      startOfItem === endOfBefore,
      `
      draggable: "${item.descriptor.id}"
      must be after
      draggable: "${before.descriptor.id}"
    `,
    );
  });
};

export const getPreset = (axis?: Axis = vertical) => {
  const windowScroll: Position = { x: 50, y: 100 };
  const assortedSpacing = withAssortedSpacing();

  // TODO: cross axis values need to account for margin of assorted spacing
  const homeBorderBoxCrossAxisStart: number =
    assortedSpacing.margin[axis.crossAxisStart];
  const homeBorderBoxCrossAxisEnd: number = homeBorderBoxCrossAxisStart + 100;

  const foreignCrossAxisStart: number = 150;
  const foreignCrossAxisEnd: number = 250;
  const emptyForeignCrossAxisStart: number = 250;
  const emptyForeignCrossAxisEnd: number = 350;

  const droppableBorderBoxSize: number = 200;
  const droppableBorderBoxStart: number = assortedSpacing.margin[axis.start];
  const droppableBorderBoxEnd: number =
    droppableBorderBoxStart + droppableBorderBoxSize;

  type BorderBoxAfterArgs = {|
    goAfter: DraggableDimension,
    droppable: DroppableDimension,
    borderBoxSize: number,
  |};

  const borderBoxAfter = ({
    goAfter,
    droppable,
    borderBoxSize,
  }: BorderBoxAfterArgs): Spacing => {
    // going beneith the margin box, and accounting for own margin
    const borderBoxStart: number =
      goAfter.client.marginBox[axis.end] + assortedSpacing.margin[axis.start];

    // sitting inside the droppable, and accounting for own margin
    const borderBoxCrossAxisStart: number =
      droppable.client.borderBox[axis.crossAxisStart] +
      assortedSpacing.margin[axis.crossAxisStart];
    const borderBoxCrossAxisEnd: number =
      droppable.client.borderBox[axis.crossAxisEnd] -
      assortedSpacing.margin[axis.crossAxisEnd];

    return {
      [axis.start]: borderBoxStart,
      [axis.crossAxisStart]: borderBoxCrossAxisStart,
      [axis.crossAxisEnd]: borderBoxCrossAxisEnd,
      [axis.end]: borderBoxStart + borderBoxSize,
    };
  };

  const home: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: 'home',
      type: 'TYPE',
    },
    borderBox: {
      [axis.start]: droppableBorderBoxStart,
      [axis.crossAxisStart]: homeBorderBoxCrossAxisStart,
      [axis.crossAxisEnd]: homeBorderBoxCrossAxisEnd,
      [axis.end]: droppableBorderBoxEnd,
    },
    ...assortedSpacing,
    windowScroll,
    direction: axis.direction,
  });

  const foreign: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: 'foreign',
      type: 'TYPE',
    },
    borderBox: {
      [axis.start]: droppableBorderBoxStart,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: droppableBorderBoxEnd,
    },
    ...assortedSpacing,
    windowScroll,
    direction: axis.direction,
  });

  const emptyForeign: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: 'empty-foreign',
      type: 'TYPE',
    },
    borderBox: {
      [axis.start]: droppableBorderBoxStart,
      [axis.crossAxisStart]: emptyForeignCrossAxisStart,
      [axis.crossAxisEnd]: emptyForeignCrossAxisEnd,
      [axis.end]: droppableBorderBoxEnd,
    },
    ...assortedSpacing,
    windowScroll,
    direction: axis.direction,
  });

  const inHome1Size: number = 20;
  const inHome1: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inhome1',
      droppableId: home.descriptor.id,
      type: home.descriptor.type,
      index: 0,
    },
    borderBox: {
      // starting inside the droppable border box
      // account for own margin
      [axis.start]:
        droppableBorderBoxStart + assortedSpacing.margin[axis.crossAxisStart],
      [axis.crossAxisStart]:
        homeBorderBoxCrossAxisStart +
        assortedSpacing.margin[axis.crossAxisStart],
      [axis.crossAxisEnd]:
        homeBorderBoxCrossAxisEnd - assortedSpacing.margin[axis.crossAxisEnd],
      [axis.end]: droppableBorderBoxStart + inHome1Size,
    },
    windowScroll,
    ...assortedSpacing,
  });

  // size: 20
  const inHome2: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inhome2',
      droppableId: home.descriptor.id,
      type: home.descriptor.type,
      index: 1,
    },
    // pushed forward by margin of inHome1
    borderBox: borderBoxAfter({
      goAfter: inHome1,
      droppable: home,
      borderBoxSize: 20,
    }),
    ...assortedSpacing,
    windowScroll,
  });
  // size: 30
  const inHome3: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inhome3',
      droppableId: home.descriptor.id,
      type: home.descriptor.type,
      index: 2,
    },
    borderBox: borderBoxAfter({
      goAfter: inHome2,
      droppable: home,
      borderBoxSize: 30,
    }),
    ...assortedSpacing,
    windowScroll,
  });
  // size: 40
  const inHome4: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inhome4',
      droppableId: home.descriptor.id,
      type: home.descriptor.type,
      index: 3,
    },
    borderBox: borderBoxAfter({
      goAfter: inHome3,
      droppable: home,
      borderBoxSize: 40,
    }),
    ...assortedSpacing,
    windowScroll,
  });
  invariant(
    inHome4.client.marginBox[axis.end] < droppableBorderBoxEnd,
    'Expecting items to be in bounds',
  );

  // size: 10
  const inForeign1: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inForeign1',
      droppableId: foreign.descriptor.id,
      type: foreign.descriptor.type,
      index: 0,
    },
    borderBox: {
      [axis.start]: 10,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 20,
    },
    ...assortedSpacing,
    windowScroll,
  });
  // size: 20
  const inForeign2: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inForeign2',
      droppableId: foreign.descriptor.id,
      type: foreign.descriptor.type,
      index: 1,
    },
    borderBox: {
      [axis.start]: 30,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 50,
    },
    ...assortedSpacing,
    windowScroll,
  });
  // size: 30
  const inForeign3: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inForeign3',
      droppableId: foreign.descriptor.id,
      type: foreign.descriptor.type,
      index: 2,
    },
    borderBox: {
      [axis.start]: 60,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 90,
    },
    ...assortedSpacing,
    windowScroll,
  });
  // size: 40
  const inForeign4: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'inForeign4',
      droppableId: foreign.descriptor.id,
      type: foreign.descriptor.type,
      index: 3,
    },
    borderBox: {
      [axis.start]: 100,
      [axis.crossAxisStart]: foreignCrossAxisStart,
      [axis.crossAxisEnd]: foreignCrossAxisEnd,
      [axis.end]: 140,
    },
    ...assortedSpacing,
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

  const inHomeList: DraggableDimension[] = [inHome1, inHome2, inHome3, inHome4];

  // validate our setup
  // only being strict with inHomeList
  validateIsInDroppable(inHomeList, home);
  validateIsStacked(inHomeList, home);

  const inForeignList: DraggableDimension[] = [
    inForeign1,
    inForeign2,
    inForeign3,
    inForeign4,
  ];

  const dimensions: DimensionMap = {
    draggables,
    droppables,
  };

  const viewport: Viewport = (() => {
    // scroll the viewport so it has the right frame
    const base: Viewport = scrollViewport(getViewport(), windowScroll);

    // set the initial and current scroll so that it is the same
    // we are faking a lift from a scrolled window
    const result: Viewport = {
      frame: base.frame,
      scroll: {
        initial: windowScroll,
        current: windowScroll,
        max: base.scroll.max,
        diff: {
          value: origin,
          displacement: origin,
        },
      },
    };
    return result;
  })();

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
    dimensions,
    inHomeList,
    inForeignList,
    windowScroll,
    viewport,
  };
};

export const disableDroppable = (
  droppable: DroppableDimension,
): DroppableDimension => ({
  ...droppable,
  isEnabled: false,
});

const windowScroll: Position = getPreset().windowScroll;

type ShiftArgs = {|
  amount: Position,
  draggables: DraggableDimensionMap,
  indexChange: number,
|};

// will not expand the droppable to make room
export const shiftDraggables = ({
  amount,
  draggables,
  indexChange,
}: ShiftArgs): DraggableDimensionMap =>
  Object.keys(draggables)
    .map((id: DraggableId) => draggables[id])
    .map((dimension: DraggableDimension) => {
      const borderBox: Spacing = offsetByPosition(
        dimension.client.borderBox,
        amount,
      );
      const client: BoxModel = createBox({
        borderBox,
        margin: dimension.client.margin,
        border: dimension.client.border,
        padding: dimension.client.padding,
      });
      const page: BoxModel = withScroll(client, windowScroll);

      const shifted: DraggableDimension = {
        descriptor: {
          ...dimension.descriptor,
          index: dimension.descriptor.index + indexChange,
        },
        displaceBy: dimension.displaceBy,
        client,
        page,
        placeholder: {
          ...dimension.placeholder,
          client,
        },
      };

      return shifted;
    })
    .reduce((previous: DraggableDimensionMap, current: DraggableDimension) => {
      previous[current.descriptor.id] = current;
      return previous;
    }, {});

export const enableCombining = (
  droppables: DroppableDimensionMap,
): DroppableDimensionMap =>
  toDroppableMap(
    toDroppableList(droppables).map(
      (droppable: DroppableDimension): DroppableDimension => ({
        ...droppable,
        isCombineEnabled: true,
      }),
    ),
  );
