// @flow
import { invariant } from '../../../../src/invariant';
import { getPreset, addDroppable } from '../../../util/dimension';
import type {
  DraggableDimension,
  CollectingState,
  Published,
  DisplacementGroups,
  DraggingState,
  DropPendingState,
  DragImpact,
} from '../../../../src/types';
import { virtualForeign, empty } from './util';
import getSimpleStatePreset from '../../../util/get-simple-state-preset';
import publish from '../../../../src/state/publish-while-dragging-in-virtual';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import { vertical } from '../../../../src/state/axis';
import type { PublicResult } from '../../../../src/state/move-in-direction/move-in-direction-types';
import moveInDirection from '../../../../src/state/move-in-direction';
import update from '../../../../src/state/post-reducer/when-moving/update';
import { getForcedDisplacement } from '../../../util/impact';
import { origin } from '../../../../src/state/position';

const preset = getPreset(vertical);
const state = getSimpleStatePreset(vertical);

it('should not animate any displacement', () => {
  // inHome1 currently in foreign
  // adding item to foreign list
  // we are ensuring this displacement is not animated

  const inHomeState: DraggingState = addDroppable(
    state.dragging(),
    virtualForeign,
  );
  const moveToForeign: ?PublicResult = moveInDirection({
    state: inHomeState,
    type: 'MOVE_RIGHT',
  });
  invariant(moveToForeign);
  const inForeignImpact: DragImpact = moveToForeign.impact;
  // validation
  {
    const displaced: DisplacementGroups = getForcedDisplacement({
      visible: [
        // initial movement goes after inForeign1
        { dimension: preset.inForeign2, shouldAnimate: true },
        { dimension: preset.inForeign3, shouldAnimate: true },
        { dimension: preset.inForeign4, shouldAnimate: true },
      ],
    });
    const impact: DragImpact = {
      displaced,
      displacedBy: getDisplacedBy(vertical, preset.inHome1.displaceBy),
      at: {
        type: 'REORDER',
        destination: {
          index: preset.inForeign2.descriptor.index,
          droppableId: preset.foreign.descriptor.id,
        },
      },
    };
    expect(impact).toEqual(inForeignImpact);
  }
  // $ExpectError - casting as different state type
  const inForeignState: DraggingState = update({
    state: inHomeState,
    clientSelection: moveToForeign.clientSelection,
    impact: inForeignImpact,
  });

  // adding item after inHome4
  const added: DraggableDimension = {
    ...preset.inForeign4,
    descriptor: {
      ...preset.inForeign4.descriptor,
      index: preset.inForeign4.descriptor.index + 1,
      id: 'added',
    },
  };
  const collectingState: CollectingState = {
    phase: 'COLLECTING',
    ...inForeignState,
    // appeasing flow
    // eslint-disable-next-line
    phase: 'COLLECTING',
  };
  const published: Published = {
    ...empty,
    additions: [added],
    modified: [{ droppableId: virtualForeign.descriptor.id, scroll: origin }],
  };

  const result: DraggingState | DropPendingState = publish({
    state: collectingState,
    published,
  });
  invariant(result.phase === 'DRAGGING');

  const displaced: DisplacementGroups = getForcedDisplacement({
    visible: [
      // original animation unchanged
      { dimension: preset.inForeign2, shouldAnimate: true },
      { dimension: preset.inForeign3, shouldAnimate: true },
      { dimension: preset.inForeign4, shouldAnimate: true },
      // addition
      { dimension: added, shouldAnimate: true },
    ],
  });
  const expected: DragImpact = {
    // same destination
    ...inForeignImpact,
    displaced,
  };
  expect(result.impact).toEqual(expected);
});
