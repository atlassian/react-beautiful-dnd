// @flow
import { getRect } from 'css-box-model';
import type {
  DisplacementGroups,
  DraggableDimension,
  DroppableDimension,
  Viewport,
  DraggableDimensionMap,
  DisplacedBy,
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
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import { getForcedDisplacement } from '../../../utils/impact';
import { offsetByPosition } from '../../../../src/state/spacing';

const viewport: Viewport = createViewport({
  frame: getRect({
    top: 0,
    right: 1000,
    left: 0,
    bottom: 1000,
  }),
  scroll: origin,
  scrollHeight: 1000,
  scrollWidth: 1000,
});

const home: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'home',
    type: 'TYPE',
    mode: 'STANDARD',
  },
  borderBox: {
    top: viewport.frame.top,
    left: viewport.frame.left,
    right: viewport.frame.right / 2,
    bottom: viewport.frame.bottom,
  },
});

const foreign: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'foreign',
    type: 'TYPE',
    mode: 'STANDARD',
  },
  borderBox: {
    top: viewport.frame.top,
    left: home.client.borderBox.left + 1,
    right: viewport.frame.right,
    bottom: viewport.frame.bottom,
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
    id: 'is-visible',
    droppableId: foreign.descriptor.id,
    type: foreign.descriptor.type,
    index: 0,
  },
  // outside of viewport but within droppable
  borderBox: viewport.frame,
});

const isVisibleDueToOverScanning: DraggableDimension = getDraggableDimension({
  descriptor: {
    id: 'is-visible-due-to-overscanning',
    droppableId: foreign.descriptor.id,
    type: foreign.descriptor.type,
    index: 1,
  },
  // outside of viewport but within droppable
  borderBox: {
    ...foreign.client.borderBox,
    top: viewport.frame.bottom + 1,
    bottom: viewport.frame.bottom + 100,
  },
});
console.log('viewport', viewport.frame);

const isNotVisible: DraggableDimension = getDraggableDimension({
  descriptor: {
    id: 'is-not-visible',
    droppableId: foreign.descriptor.id,
    type: foreign.descriptor.type,
    index: 2,
  },
  // outside of viewport but within droppable
  // TODO - shift so not impacted by overscanning
  borderBox: {
    ...viewport.frame,
    top: viewport.frame.bottom + dragging.client.marginBox.height + 1,
    bottom: viewport.frame.bottom + dragging.client.marginBox.height + 10,
  },
});

console.log('shifted');

const draggables: DraggableDimensionMap = toDraggableMap([
  dragging,
  isVisible,
  isVisibleDueToOverScanning,
  isNotVisible,
]);

const { afterCritical, impact: homeImpact } = getLiftEffect({
  draggable: dragging,
  home,
  draggables,
  viewport,
});

describe('initial displacement', () => {
  it.only('should correctly mark visible items', () => {
    const result: DisplacementGroups = getDisplacementGroups({
      afterDragging: [isVisible, isVisibleDueToOverScanning, isNotVisible],
      destination: foreign,
      displacedBy,
      last: homeImpact.displaced,
      viewport: viewport.frame,
    });

    const expected: DisplacementGroups = getForcedDisplacement({
      visible: [isVisible, isVisibleDueToOverScanning],
      // overscanning
      invisible: [isNotVisible],
    });

    expect(result).toEqual(expected);
  });

  it('should correctly mark invisible items', () => {
    const result: DisplacementGroups = getDisplacementGroups({
      draggable: isVisibleDueToOverScanning,
      destination: foreign,
      previousImpact: homeImpact,
      viewport: viewport.frame,
      afterCritical,
    });

    const expected: DisplacementGroups = {
      draggableId: isVisibleDueToOverScanning.descriptor.id,
      isVisible: false,
      shouldAnimate: false,
    };
    expect(result).toEqual(expected);
  });
});

describe('subsequent displacement', () => {
  it('should correctly mark visible items', () => {
    const result: DisplacementGroups = getDisplacementGroups({
      draggable: isVisible,
      destination: foreign,
      previousImpact: noImpact,
      viewport: viewport.frame,
      afterCritical,
    });

    const expected: DisplacementGroups = {
      draggableId: isVisible.descriptor.id,
      isVisible: true,
      shouldAnimate: true,
    };
    expect(result).toEqual(expected);
  });

  it('should correctly mark invisible items', () => {
    const result: DisplacementGroups = getDisplacementGroups({
      draggable: isVisibleDueToOverScanning,
      destination: foreign,
      previousImpact: noImpact,
      viewport: viewport.frame,
      afterCritical,
    });

    const expected: DisplacementGroups = {
      draggableId: isVisibleDueToOverScanning.descriptor.id,
      isVisible: false,
      shouldAnimate: false,
    };
    expect(result).toEqual(expected);
  });
});
