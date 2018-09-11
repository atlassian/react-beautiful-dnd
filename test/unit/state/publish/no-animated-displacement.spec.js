// @flow
import invariant from 'tiny-invariant';
import { getPreset, addDroppable } from '../../../utils/dimension';
import type {
  DraggableDimension,
  CollectingState,
  Published,
  DraggingState,
  DropPendingState,
  DragImpact,
} from '../../../../src/types';
import { scrollableHome, empty } from './util';
import getSimpleStatePreset from '../../../utils/get-simple-state-preset';
import publish from '../../../../src/state/publish';

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

  const expected: DragImpact = {
    movement: {
      displaced: [
        {
          draggableId: added.descriptor.id,
          isVisible: true,
          // animation cleared
          shouldAnimate: false,
        },
      ],
      amount: { x: 0, y: added.client.marginBox.height },
      // this is a little confusing.
      // The position of the dragging item has been patched
      // to keep it in the same visual spot. This has actually
      // resulting in the dragging item moving backwards
      isInFrontOfStart: false,
    },
    direction: scrollableHome.axis.direction,
    destination: {
      // still in the original position
      index: 0,
      droppableId: scrollableHome.descriptor.id,
    },
  };
  expect(result.impact).toEqual(expected);
});
