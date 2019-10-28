// @flow
import { type Position } from 'css-box-model';
import { invariant } from '../../../../src/invariant';
import scrollDroppable from '../../../../src/state/droppable/scroll-droppable';
import publish from '../../../../src/state/publish-while-dragging-in-virtual';
import {
  addDroppable,
  getFrame,
  getPreset,
  makeVirtual,
} from '../../../util/dimension';
import getStatePreset from '../../../util/get-simple-state-preset';
import { empty } from './util';
import type {
  DroppableDimension,
  CollectingState,
  Published,
  DraggingState,
  DropPendingState,
} from '../../../../src/types';

const preset = getPreset();
const state = getStatePreset();

it('should adjust the current droppable scroll in response to a change', () => {
  // sometimes the scroll of a droppable is impacted by the adding or removing of droppables
  // we need to ensure that the droppable has the correct current scroll and diffs based on the insertion

  const originalScroll: Position = { x: 0, y: 20 };
  const currentScroll: Position = { x: 0, y: 5 };

  // Dragging inHome2 and inHome1 is removed
  const virtualHome: DroppableDimension = makeVirtual(
    preset.home,
    originalScroll.y,
  );
  const beforeRemoval: DroppableDimension = scrollDroppable(
    virtualHome,
    originalScroll,
  );

  // $FlowFixMe - wrong type
  const original: CollectingState = addDroppable(
    // $FlowFixMe - wrong type
    state.collecting(preset.inHome2.descriptor.id),
    beforeRemoval,
  );

  const published: Published = {
    ...empty,
    removals: [preset.inHome1.descriptor.id],
    modified: [
      { droppableId: virtualHome.descriptor.id, scroll: currentScroll },
    ],
  };

  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  invariant(result.phase === 'DRAGGING');

  const updated: DroppableDimension =
    result.dimensions.droppables[preset.home.descriptor.id];
  // current scroll set to the
  expect(getFrame(updated).scroll.current).toEqual(currentScroll);
});
