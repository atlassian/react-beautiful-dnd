// @flow
import invariant from 'tiny-invariant';
import { getPreset, addDroppable } from '../../../utils/dimension';
import type {
  Axis,
  DraggableDimension,
  CollectingState,
  Published,
  DraggingState,
  DropPendingState,
  DragImpact,
  Displacement,
} from '../../../../src/types';
import { scrollableHome, empty } from './util';
import getSimpleStatePreset from '../../../utils/get-simple-state-preset';
import publish from '../../../../src/state/publish';
import getDisplacementMap from '../../../../src/state/get-displacement-map';
import { patch } from '../../../../src/state/position';

const preset = getPreset();
const state = getSimpleStatePreset();

it('should not animate any displacement', () => {
  // adding item into index 0 before the dragging item
  // it should be displaced forward
  // we are ensuring this displacement is not animated

  // inserting item where inHome1 is
  const added: DraggableDimension = {
    ...preset.inHome1,
    descriptor: {
      ...preset.inHome1.descriptor,
      index: preset.inHome1.descriptor.index,
      id: 'added',
    },
  };
  // $FlowFixMe - wrong type
  const original: CollectingState = addDroppable(
    // $FlowFixMe - wrong type
    state.collecting(),
    scrollableHome,
  );
  const published: Published = {
    ...empty,
    additions: [added],
    modified: [scrollableHome],
  };

  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  invariant(result.phase === 'DRAGGING');

  const displaced: Displacement[] = [
    {
      draggableId: added.descriptor.id,
      isVisible: true,
      // animation cleared
      shouldAnimate: false,
    },
  ];
  const axis: Axis = preset.home.axis;

  const expected: DragImpact = {
    movement: {
      displaced,
      map: getDisplacementMap(displaced),
      displacedBy: {
        value: preset.inHome1.displaceBy[axis.line],
        point: patch(axis.line, preset.inHome1.displaceBy[axis.line]),
      },
      willDisplaceForward: true,
    },
    direction: scrollableHome.axis.direction,
    destination: {
      // still in the original position
      index: 0,
      droppableId: scrollableHome.descriptor.id,
    },

    merge: null,
  };
  expect(result.impact).toEqual(expected);
});
