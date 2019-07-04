// @flow
import { getRect } from 'css-box-model';
import type {
  DragImpact,
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
import { emptyGroups } from '../../../../src/state/no-impact';
import scrollViewport from '../../../../src/state/scroll-viewport';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
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

it('should not animate previously invisible displacement', () => {
  // scrolling enough for isNotVisible to be visible
  const scrolled: Viewport = scrollViewport(viewport, {
    x: 0,
    y: 10,
  });

  // isNotVisible was displaced but not visible
  // We are now going to make it visible and ensure that it is not animated
  const last: DisplacementGroups = getForcedDisplacement({
    visible: [
      {
        dimension: isVisible,
        // already started displaced
        shouldAnimate: false,
      },
    ],
    invisible: [isNotVisible],
  });

  const result: DisplacementGroups = getDisplacementGroups({
    afterDragging,
    displacedBy,
    destination: home,
    last,
    viewport: scrolled.frame,
  });

  const expected: DisplacementGroups = getForcedDisplacement({
    visible: [
      {
        dimension: isVisible,
        // already started displaced
        shouldAnimate: false,
      },
      {
        dimension: isNotVisible,
        // was previously visible so now will not animate
        shouldAnimate: false,
      },
    ],
  });
  expect(result).toEqual(expected);
});

it('should return nothing when nothing is after the dragging item', () => {
  const result: DisplacementGroups = getDisplacementGroups({
    afterDragging: [],
    destination: home,
    displacedBy,
    last: homeImpact.displaced,
    viewport: viewport.frame,
  });

  expect(result).toEqual(emptyGroups);
});
