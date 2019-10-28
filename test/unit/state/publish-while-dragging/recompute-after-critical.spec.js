// @flow
import { invariant } from '../../../../src/invariant';
import getStatePreset from '../../../util/get-simple-state-preset';
import type {
  Published,
  DraggableDimension,
  DropPendingState,
  DraggingState,
  DragImpact,
  DisplacementGroups,
  DisplacedBy,
  CollectingState,
  LiftEffect,
} from '../../../../src/types';
import publish from '../../../../src/state/publish-while-dragging-in-virtual';
import { getPreset } from '../../../util/dimension';
import { empty, withVirtuals, virtualHome } from './util';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import { vertical } from '../../../../src/state/axis';
import { origin } from '../../../../src/state/position';
import { getForcedDisplacement } from '../../../util/impact';

const state = getStatePreset();
const preset = getPreset(vertical);

it('should recalculate after critical (something added)', () => {
  const displacedBy: DisplacedBy = getDisplacedBy(
    vertical,
    preset.inHome1.displaceBy,
  );
  const added: DraggableDimension = {
    ...preset.inHome4,
    descriptor: {
      ...preset.inHome4.descriptor,
      index: preset.inHome4.descriptor.index + 1,
      id: 'added',
    },
  };
  const published: Published = {
    ...empty,
    additions: [added],
    modified: [{ droppableId: virtualHome.descriptor.id, scroll: origin }],
  };

  const original: CollectingState = withVirtuals(state.collecting());
  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  invariant(result.phase === 'DRAGGING');

  {
    const expected: LiftEffect = {
      inVirtualList: true,
      effected: {
        // part of the original onLift
        [preset.inHome2.descriptor.id]: true,
        [preset.inHome3.descriptor.id]: true,
        [preset.inHome4.descriptor.id]: true,
        // added
        [added.descriptor.id]: true,
      },
      displacedBy,
    };

    expect(result.afterCritical).toEqual(expected);
  }

  {
    const displaced: DisplacementGroups = getForcedDisplacement({
      visible: [
        { dimension: preset.inHome2, shouldAnimate: false },
        { dimension: preset.inHome3, shouldAnimate: false },
        { dimension: preset.inHome4, shouldAnimate: false },
        { dimension: added, shouldAnimate: false },
      ],
    });
    const expected: DragImpact = {
      displacedBy,
      displaced,
      at: original.onLiftImpact.at,
    };
    expect(result.onLiftImpact).toEqual(expected);
  }
});

it('should recalculate after critical (something removed)', () => {
  const displacedBy: DisplacedBy = getDisplacedBy(
    vertical,
    preset.inHome1.displaceBy,
  );
  const published: Published = {
    removals: [preset.inHome4.descriptor.id],
    additions: [],
    modified: [{ droppableId: virtualHome.descriptor.id, scroll: origin }],
  };

  const original: CollectingState = withVirtuals(state.collecting());
  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  invariant(result.phase === 'DRAGGING');

  {
    const expected: LiftEffect = {
      inVirtualList: true,
      effected: {
        [preset.inHome2.descriptor.id]: true,
        [preset.inHome3.descriptor.id]: true,
        // preset.inHome4 is gone
      },
      displacedBy,
    };

    expect(result.afterCritical).toEqual(expected);
  }

  {
    const displaced: DisplacementGroups = getForcedDisplacement({
      visible: [
        { dimension: preset.inHome2, shouldAnimate: false },
        { dimension: preset.inHome3, shouldAnimate: false },
      ],
    });
    const expected: DragImpact = {
      displacedBy,
      displaced,
      at: original.onLiftImpact.at,
    };
    expect(result.onLiftImpact).toEqual(expected);
  }
});
