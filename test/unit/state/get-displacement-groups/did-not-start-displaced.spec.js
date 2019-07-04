// @flow
import { getRect } from 'css-box-model';
import type {
  DisplacementGroups,
  DraggableDimension,
  DroppableDimension,
  Viewport,
  DraggableDimensionMap,
  DisplacedBy,
  Axis,
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
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import { getForcedDisplacement } from '../../../utils/impact';
import { vertical, horizontal } from '../../../../src/state/axis';

[vertical, horizontal].forEach((axis: Axis) => {
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
    direction: axis.direction,
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
    direction: axis.direction,
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

  const displacedBy: DisplacedBy = getDisplacedBy(
    home.axis,
    dragging.displaceBy,
  );

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
      [axis.start]: viewport.frame[axis.end] + 1,
      [axis.end]: viewport.frame[axis.end] + 100,
    },
  });

  const isNotVisible: DraggableDimension = getDraggableDimension({
    descriptor: {
      id: 'is-not-visible',
      droppableId: foreign.descriptor.id,
      type: foreign.descriptor.type,
      index: 2,
    },
    // outside of viewport but within droppable
    borderBox: {
      ...viewport.frame,
      [axis.start]:
        viewport.frame[axis.end] + dragging.client.marginBox[axis.size] + 1,
      [axis.end]:
        viewport.frame[axis.end] + dragging.client.marginBox[axis.size] + 10,
    },
  });

  const draggables: DraggableDimensionMap = toDraggableMap([
    dragging,
    isVisible,
    isVisibleDueToOverScanning,
    isNotVisible,
  ]);

  const { impact: homeImpact } = getLiftEffect({
    draggable: dragging,
    home,
    draggables,
    viewport,
  });

  const afterDragging: DraggableDimension[] = [
    isVisible,
    isVisibleDueToOverScanning,
    isNotVisible,
  ];

  it(`should correctly mark visibility on ${axis.direction} axis`, () => {
    const result: DisplacementGroups = getDisplacementGroups({
      afterDragging,
      destination: foreign,
      displacedBy,
      last: homeImpact.displaced,
      viewport: viewport.frame,
    });

    const expected: DisplacementGroups = getForcedDisplacement({
      visible: [
        { dimension: isVisible },
        // overscanning
        { dimension: isVisibleDueToOverScanning },
      ],
      invisible: [isNotVisible],
    });

    expect(result).toEqual(expected);
  });
});
