// @flow
import type {
  DisplacedBy,
  Displacement,
  DragImpact,
} from '../../../../../src/types';
import getDropImpact, {
  type Result,
} from '../../../../../src/state/middleware/drop/get-drop-impact';
import noImpact, { noMovement } from '../../../../../src/state/no-impact';
import getHomeOnLift from '../../../../../src/state/get-home-on-lift';
import { getPreset } from '../../../../utils/dimension';
import getDisplacedBy from '../../../../../src/state/get-displaced-by';
import { vertical } from '../../../../../src/state/axis';
import { forward } from '../../../../../src/state/user-direction/user-direction-preset';
import getDisplacementMap from '../../../../../src/state/get-displacement-map';
import getVisibleDisplacement from '../../../../utils/get-displacement/get-visible-displacement';
import getNotAnimatedDisplacement from '../../../../utils/get-displacement/get-not-animated-displacement';

const preset = getPreset();

const { onLift, impact: homeImpact } = getHomeOnLift({
  draggable: preset.inHome1,
  draggables: preset.draggables,
  home: preset.home,
  viewport: preset.viewport,
});
const displacedBy: DisplacedBy = getDisplacedBy(
  vertical,
  preset.inHome1.displaceBy,
);

const recomputedHomeImpact: DragImpact = (() => {
  // when recomputed the displaced will be animated
  // originally it was not
  const displaced: Displacement[] = [
    getVisibleDisplacement(preset.inHome2),
    getVisibleDisplacement(preset.inHome3),
    getVisibleDisplacement(preset.inHome4),
  ];
  const impact: DragImpact = {
    ...homeImpact,
    movement: {
      displaced,
      map: getDisplacementMap(displaced),
      displacedBy,
    },
  };
  return impact;
})();

it('should recompute the home impact when not dropped in a list', () => {
  const result: Result = getDropImpact({
    reason: 'DROP',
    lastImpact: noImpact,
    home: preset.home,
    viewport: preset.viewport,
    draggables: preset.draggables,
    onLiftImpact: homeImpact,
    onLift,
  });

  const expected: Result = {
    impact: recomputedHomeImpact,
    didDropInsideDroppable: false,
  };
  expect(result).toEqual(expected);
});

it('should recompute the home impact when the drag is cancelled', () => {
  const result: Result = getDropImpact({
    reason: 'CANCEL',
    // was over home
    lastImpact: homeImpact,
    home: preset.home,
    viewport: preset.viewport,
    draggables: preset.draggables,
    onLiftImpact: homeImpact,
    onLift,
  });

  const expected: Result = {
    impact: recomputedHomeImpact,
    didDropInsideDroppable: false,
  };
  expect(result).toEqual(expected);
});

it('should use the existing impact when reordering', () => {
  // inHome1 moved into position of inHome2
  const displaced: Displacement[] = [
    // initial displacement is not animated
    getNotAnimatedDisplacement(preset.inHome3),
    getNotAnimatedDisplacement(preset.inHome4),
  ];
  const lastImpact: DragImpact = {
    movement: {
      displaced,
      map: getDisplacementMap(displaced),
      displacedBy,
    },
    direction: vertical.direction,
    destination: {
      index: preset.inHome2.descriptor.index,
      droppableId: preset.home.descriptor.id,
    },
    merge: null,
  };

  const result: Result = getDropImpact({
    reason: 'DROP',
    lastImpact,
    home: preset.home,
    viewport: preset.viewport,
    draggables: preset.draggables,
    onLiftImpact: homeImpact,
    onLift,
  });

  const expected: Result = {
    impact: lastImpact,
    didDropInsideDroppable: true,
  };
  expect(result).toEqual(expected);
});

it('should remove any movement when merging so items will collapse', () => {
  const lastImpact: DragImpact = (() => {
    // inHome1 moved forward and merged with inHome3
    const displaced: Displacement[] = [
      // inHome2 has been moved past
      // initial displacement is not animated
      getNotAnimatedDisplacement(preset.inHome3),
      getNotAnimatedDisplacement(preset.inHome4),
    ];
    return {
      movement: {
        displaced,
        map: getDisplacementMap(displaced),
        displacedBy,
      },
      direction: vertical.direction,
      destination: null,
      merge: {
        whenEntered: forward,
        combine: {
          droppableId: preset.home.descriptor.id,
          draggableId: preset.inHome3.descriptor.id,
        },
      },
    };
  })();

  const result: Result = getDropImpact({
    reason: 'DROP',
    lastImpact,
    home: preset.home,
    viewport: preset.viewport,
    draggables: preset.draggables,
    onLiftImpact: homeImpact,
    onLift,
  });

  const newImpact: DragImpact = {
    ...lastImpact,
    movement: noMovement,
  };
  const expected: Result = {
    impact: newImpact,
    didDropInsideDroppable: true,
  };
  expect(result).toEqual(expected);
});
