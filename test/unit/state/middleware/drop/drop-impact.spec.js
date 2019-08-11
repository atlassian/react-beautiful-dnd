// @flow
import type {
  DisplacedBy,
  Displacement,
  DragImpact,
} from '../../../../../src/types';
import getDropImpact, {
  type Result,
} from '../../../../../src/state/middleware/drop/get-drop-impact';
import noImpact, { emptyGroups } from '../../../../../src/state/no-impact';
import getLiftEffect from '../../../../../src/state/get-lift-effect';
import { getPreset } from '../../../../util/dimension';
import getDisplacedBy from '../../../../../src/state/get-displaced-by';
import { vertical } from '../../../../../src/state/axis';
import { forward } from '../../../../../src/state/user-direction/user-direction-preset';
import { getForcedDisplacement } from '../../../../util/impact';

const preset = getPreset();

const { afterCritical, impact: homeImpact } = getLiftEffect({
  draggable: preset.inHome1,
  draggables: preset.draggables,
  home: preset.home,
  viewport: preset.viewport,
});
const displacedBy: DisplacedBy = getDisplacedBy(
  vertical,
  preset.inHome1.displaceBy,
);

const recomputedHomeImpact: DragImpact = {
  displaced: getForcedDisplacement({
    visible: [
      // when recomputed the displaced will be animated
      // originally it was not
      { dimension: preset.inHome2 },
      { dimension: preset.inHome3 },
      { dimension: preset.inHome4 },
    ],
  }),
  displacedBy,
  at: homeImpact.at,
};

it('should recompute the home impact when not dropped in a list', () => {
  const result: Result = getDropImpact({
    reason: 'DROP',
    lastImpact: noImpact,
    home: preset.home,
    viewport: preset.viewport,
    draggables: preset.draggables,
    onLiftImpact: homeImpact,
    afterCritical,
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
    afterCritical,
  });

  const expected: Result = {
    impact: recomputedHomeImpact,
    didDropInsideDroppable: false,
  };
  expect(result).toEqual(expected);
});

it('should use the existing impact when reordering', () => {
  // inHome1 moved into position of inHome2
  const lastImpact: DragImpact = {
    displaced: getForcedDisplacement({
      // initial displacement is not animated
      visible: [
        { dimension: preset.inHome3, shouldAnimate: false },
        { dimension: preset.inHome4, shouldAnimate: false },
      ],
    }),
    displacedBy,
    at: {
      type: 'REORDER',
      destination: {
        index: preset.inHome2.descriptor.index,
        droppableId: preset.home.descriptor.id,
      },
    },
  };

  const result: Result = getDropImpact({
    reason: 'DROP',
    lastImpact,
    home: preset.home,
    viewport: preset.viewport,
    draggables: preset.draggables,
    onLiftImpact: homeImpact,
    afterCritical,
  });

  const expected: Result = {
    impact: lastImpact,
    didDropInsideDroppable: true,
  };
  expect(result).toEqual(expected);
});

it('should remove any movement when merging so items will collapse', () => {
  // inHome1 moved forward and merged with inHome3
  // inHome2 has been moved past
  const lastImpact: DragImpact = {
    displaced: getForcedDisplacement({
      visible: [
        // initial displacement is not animated
        { dimension: preset.inHome3, shouldAnimate: false },
        { dimension: preset.inHome4, shouldAnimate: false },
      ],
    }),
    displacedBy,
    at: {
      type: 'COMBINE',
      whenEntered: forward,
      combine: {
        droppableId: preset.home.descriptor.id,
        draggableId: preset.inHome3.descriptor.id,
      },
    },
  };

  const result: Result = getDropImpact({
    reason: 'DROP',
    lastImpact,
    home: preset.home,
    viewport: preset.viewport,
    draggables: preset.draggables,
    onLiftImpact: homeImpact,
    afterCritical,
  });

  const newImpact: DragImpact = {
    ...lastImpact,
    displaced: emptyGroups,
  };
  const expected: Result = {
    impact: newImpact,
    didDropInsideDroppable: true,
  };
  expect(result).toEqual(expected);
});
