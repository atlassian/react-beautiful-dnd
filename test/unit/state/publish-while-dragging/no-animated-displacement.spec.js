// @flow
import invariant from 'tiny-invariant';
import { getPreset, addDroppable } from '../../../util/dimension';
import type {
  DraggableDimension,
  CollectingState,
  Published,
  DraggingState,
  DropPendingState,
  DragImpact,
  Displacement,
} from '../../../../src/types';
import { scrollableForeign, empty } from './util';
import getSimpleStatePreset from '../../../util/get-simple-state-preset';
import publish from '../../../../src/state/publish-while-dragging';
import getDisplacementMap from '../../../../src/state/get-displacement-map';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import getNotAnimatedDisplacement from '../../../util/get-displacement/get-not-animated-displacement';
import getVisibleDisplacement from '../../../util/get-displacement/get-visible-displacement';
import { vertical } from '../../../../src/state/axis';
import type { PublicResult } from '../../../../src/state/move-in-direction/move-in-direction-types';
import moveInDirection from '../../../../src/state/move-in-direction';
import update from '../../../../src/state/post-reducer/when-moving/update';

const preset = getPreset(vertical);
const state = getSimpleStatePreset(vertical);

it('should not animate any displacement', () => {
  // inHome1 currently in foreign
  // adding item to foreign list
  // we are ensuring this displacement is not animated

  const inHomeState: DraggingState = addDroppable(
    state.dragging(),
    scrollableForeign,
  );
  const moveToForeign: ?PublicResult = moveInDirection({
    state: inHomeState,
    type: 'MOVE_RIGHT',
  });
  invariant(moveToForeign);
  const inForeignImpact: DragImpact = moveToForeign.impact;
  // validation
  {
    const displaced: Displacement[] = [
      // initial movement goes after inForeign1
      getVisibleDisplacement(preset.inForeign2),
      getVisibleDisplacement(preset.inForeign3),
      getVisibleDisplacement(preset.inForeign4),
    ];
    const impact: DragImpact = {
      movement: {
        displaced,
        map: getDisplacementMap(displaced),
        displacedBy: getDisplacedBy(vertical, preset.inHome1.displaceBy),
      },
      destination: {
        index: preset.inForeign2.descriptor.index,
        droppableId: preset.foreign.descriptor.id,
      },
      merge: null,
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
    modified: [scrollableForeign],
  };

  const result: DraggingState | DropPendingState = publish({
    state: collectingState,
    published,
  });
  invariant(result.phase === 'DRAGGING');

  const displaced: Displacement[] = [
    // previously animated displacement is now forced to not animate
    getNotAnimatedDisplacement(preset.inForeign2),
    getNotAnimatedDisplacement(preset.inForeign3),
    getNotAnimatedDisplacement(preset.inForeign4),
    // newly added displacement forced not to animate
    getNotAnimatedDisplacement(added),
  ];
  const expected: DragImpact = {
    // same destination
    ...inForeignImpact,
    movement: {
      displaced,
      map: getDisplacementMap(displaced),
      displacedBy: getDisplacedBy(vertical, preset.inHome1.displaceBy),
    },
  };
  expect(result.impact).toEqual(expected);
});
