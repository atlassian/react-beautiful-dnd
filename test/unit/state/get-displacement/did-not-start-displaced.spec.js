// @flow
import { getRect } from 'css-box-model';
import type {
  Displacement,
  DraggableDimension,
  DroppableDimension,
  Viewport,
  DraggableDimensionMap,
} from '../../../../src/types';
import getDisplacement from '../../../../src/state/get-displacement';
import {
  getDroppableDimension,
  getDraggableDimension,
} from '../../../utils/dimension';

import { toDraggableMap } from '../../../../src/state/dimension-structures';
import getHomeOnLift from '../../../../src/state/get-home-on-lift';
import { createViewport } from '../../../utils/viewport';
import { origin } from '../../../../src/state/position';
import noImpact from '../../../../src/state/no-impact';

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
    id: 'foreign',
    type: 'TYPE',
  },
  borderBox: {
    top: viewport.frame.top,
    left: viewport.frame.left,
    right: viewport.frame.right / 2,
    // much longer than viewport
    bottom: viewport.frame.bottom + 2000,
  },
});

const foreign: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'foreign',
    type: 'TYPE',
  },
  borderBox: {
    top: viewport.frame.top,
    left: home.client.borderBox.left + 1,
    right: viewport.frame.right,
    // much longer than viewport
    bottom: viewport.frame.bottom + 2000,
  },
});

const dragging: DraggableDimension = getDraggableDimension({
  descriptor: {
    id: 'in-viewport',
    droppableId: 'home',
    type: foreign.descriptor.type,
    index: 0,
  },
  borderBox: {
    top: 0,
    left: 0,
    right: 200,
    bottom: 200,
  },
});

const isVisible: DraggableDimension = getDraggableDimension({
  descriptor: {
    id: 'not-in-viewport',
    droppableId: foreign.descriptor.id,
    type: foreign.descriptor.type,
    index: 1,
  },
  // outside of viewport but within droppable
  borderBox: viewport.frame,
});

const isNotVisible: DraggableDimension = getDraggableDimension({
  descriptor: {
    id: 'not-in-viewport',
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

const draggables: DraggableDimensionMap = toDraggableMap([
  dragging,
  isVisible,
  isNotVisible,
]);

const { onLift, impact: homeImpact } = getHomeOnLift({
  draggable: dragging,
  home,
  draggables,
  viewport,
});

describe('initial displacement', () => {
  it('should correctly mark visible items', () => {
    const result: Displacement = getDisplacement({
      draggable: isVisible,
      destination: foreign,
      previousImpact: homeImpact,
      viewport: viewport.frame,
      onLift,
    });

    const expected: Displacement = {
      draggableId: isVisible.descriptor.id,
      isVisible: true,
      shouldAnimate: true,
    };
    expect(result).toEqual(expected);
  });

  it('should correctly mark invisible items', () => {
    const result: Displacement = getDisplacement({
      draggable: isNotVisible,
      destination: foreign,
      previousImpact: homeImpact,
      viewport: viewport.frame,
      onLift,
    });

    const expected: Displacement = {
      draggableId: isNotVisible.descriptor.id,
      isVisible: false,
      shouldAnimate: false,
    };
    expect(result).toEqual(expected);
  });
});

describe('subsequent displacement', () => {
  it('should correctly mark visible items', () => {
    const result: Displacement = getDisplacement({
      draggable: isVisible,
      destination: foreign,
      previousImpact: noImpact,
      viewport: viewport.frame,
      onLift,
    });

    const expected: Displacement = {
      draggableId: isVisible.descriptor.id,
      isVisible: true,
      shouldAnimate: true,
    };
    expect(result).toEqual(expected);
  });

  it('should correctly mark invisible items', () => {
    const result: Displacement = getDisplacement({
      draggable: isNotVisible,
      destination: foreign,
      previousImpact: noImpact,
      viewport: viewport.frame,
      onLift,
    });

    const expected: Displacement = {
      draggableId: isNotVisible.descriptor.id,
      isVisible: false,
      shouldAnimate: false,
    };
    expect(result).toEqual(expected);
  });
});
