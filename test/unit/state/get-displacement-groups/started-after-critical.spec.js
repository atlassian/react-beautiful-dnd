// @flow
import { getRect } from 'css-box-model';
import type {
  DragImpact,
  Displacement,
  DraggableDimension,
  DroppableDimension,
  Viewport,
  DraggableDimensionMap,
  DisplacedBy,
  DisplacementGroups,
} from '../../../../src/types';
import getDisplacementGroups from '../../../../src/state/get-displacement-groups';
import {
  getDroppableDimension,
  getDraggableDimension,
} from '../../../utils/dimension';
import { toDraggableMap } from '../../../../src/state/dimension-structures';
import getLiftEffect from '../../../../src/state/get-lift-effect';
import { createViewport } from '../../../utils/viewport';
import { origin } from '../../../../src/state/position';
import noImpact from '../../../../src/state/no-impact';
import scrollViewport from '../../../../src/state/scroll-viewport';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import { vertical } from '../../../../src/state/axis';
import { getForcedDisplacement } from '../../../utils/impact';

const viewport: Viewport = createViewport({
  frame: getRect({
    top: 0,
    right: 800,
    left: 0,
    bottom: 600,
  }),
  scroll: origin,
  scrollHeight: 600,
  scrollWidth: 800,
});

const home: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'drop',
    type: 'TYPE',
    mode: 'STANDARD',
  },
  borderBox: {
    ...viewport.frame,
    // much longer than viewport
    bottom: viewport.frame.bottom + 2000,
  },
});

const dragging: DraggableDimension = getDraggableDimension({
  descriptor: {
    id: 'in-viewport',
    droppableId: home.descriptor.id,
    type: home.descriptor.type,
    index: 0,
  },
  borderBox: {
    top: 0,
    left: 0,
    right: 200,
    bottom: 200,
  },
});

const displacedBy: DisplacedBy = getDisplacedBy(home.axis, dragging.displaceBy);

const isVisible: DraggableDimension = getDraggableDimension({
  descriptor: {
    id: 'not-in-viewport',
    droppableId: home.descriptor.id,
    type: home.descriptor.type,
    index: 1,
  },
  // outside of viewport but within droppable
  borderBox: {
    top: 201,
    left: 0,
    right: 200,
    bottom: 300,
  },
});

const isNotVisible: DraggableDimension = getDraggableDimension({
  descriptor: {
    id: 'not-in-viewport',
    droppableId: home.descriptor.id,
    type: home.descriptor.type,
    index: 1,
  },
  // outside of viewport but within droppable
  borderBox: {
    top: 810,
    left: 0,
    right: 200,
    bottom: 850,
  },
});

const draggables: DraggableDimensionMap = toDraggableMap([
  dragging,
  isVisible,
  isNotVisible,
]);

const { impact: homeImpact } = getLiftEffect({
  draggable: dragging,
  home,
  draggables,
  viewport,
});

const afterDragging: DraggableDimension[] = [isVisible, isNotVisible];

describe('still displaced', () => {
  it('should correctly mark item visibility', () => {
    const result: DisplacementGroups = getDisplacementGroups({
      afterDragging,
      destination: home,
      displacedBy,
      last: homeImpact.displaced,
      viewport: viewport.frame,
    });

    const expected: DisplacementGroups = getForcedDisplacement({
      visible: [
        {
          dimension: isVisible,
          // already started displaced
          shouldAnimate: false,
        },
      ],
      invisible: [isNotVisible],
    });

    expect(result).toEqual(expected);
  });
});

describe('no longer displaced', () => {
  it('should correctly mark visible items', () => {
    const result: Displacement = getDisplacementGroups({
      draggable: isVisible,
      destination: home,
      previousImpact: noImpact,
      viewport: viewport.frame,
      afterCritical,
    });

    const expected: Displacement = {
      draggableId: isVisible.descriptor.id,
      isVisible: true,
      // now displacement is animated
      shouldAnimate: true,
    };
    expect(result).toEqual(expected);
  });

  it('should correctly mark invisible items', () => {
    const result: Displacement = getDisplacementGroups({
      draggable: isNotVisible,
      destination: home,
      previousImpact: noImpact,
      viewport: viewport.frame,
      afterCritical,
    });

    const expected: Displacement = {
      draggableId: isNotVisible.descriptor.id,
      isVisible: false,
      shouldAnimate: false,
    };
    expect(result).toEqual(expected);
  });
});

describe('element has become visible after displacement', () => {
  // scrolling enough for isNotVisible to be visible
  const scrolled: Viewport = scrollViewport(viewport, {
    x: 0,
    y: 10,
  });

  it('should keep the displacement not animated if already initially displaced', () => {
    const result: Displacement = getDisplacementGroups({
      draggable: isNotVisible,
      destination: home,
      previousImpact: homeImpact,
      viewport: scrolled.frame,
      afterCritical,
    });

    const expected: Displacement = {
      draggableId: isNotVisible.descriptor.id,
      // is now visible
      isVisible: true,
      // keeping displacement not animated
      shouldAnimate: false,
    };
    expect(result).toEqual(expected);
  });

  it('should keep the displacement animated if re-displaced', () => {
    const displaced: Displacement[] = [
      getVisibleDisplacement(isVisible),
      // previously was displaced, but not animated
      getNotVisibleDisplacement(isNotVisible),
    ];
    const previous: DragImpact = {
      movement: {
        displaced,
        map: getDisplacementGroupsMap(displaced),
        displacedBy: getDisplacedBy(vertical, dragging.displaceBy),
      },
      destination: {
        index: 0,
        droppableId: home.descriptor.id,
      },
      merge: null,
    };
    const result: Displacement = getDisplacementGroups({
      draggable: isNotVisible,
      destination: home,
      previousImpact: previous,
      viewport: scrolled.frame,
      afterCritical,
    });

    const expected: Displacement = {
      draggableId: isNotVisible.descriptor.id,
      // is now visible
      isVisible: true,
      // not animating displacement as was previously displaced while not visible
      shouldAnimate: false,
    };
    expect(result).toEqual(expected);
  });
});
