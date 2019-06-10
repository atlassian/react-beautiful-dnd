// @flow
import invariant from 'tiny-invariant';
import getStatePreset from '../../../utils/get-simple-state-preset';
import type {
  Published,
  DraggableDimension,
  DropPendingState,
  DraggingState,
  DragImpact,
  Displacement,
  OnLift,
  DisplacedBy,
  CollectingState,
} from '../../../../src/types';
import publish from '../../../../src/state/publish-while-dragging';
import { getPreset } from '../../../utils/dimension';
import { empty, withScrollables, scrollableHome } from './util';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import { vertical } from '../../../../src/state/axis';
import getDisplacementMap from '../../../../src/state/get-displacement-map';
import getNotAnimatedDisplacement from '../../../utils/get-displacement/get-not-animated-displacement';

const state = getStatePreset();
const preset = getPreset(vertical);

it('should shift added dimensions to account for a collapsed home', () => {
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
    modified: [scrollableHome],
  };

  const original: CollectingState = withScrollables(state.collecting());
  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  invariant(result.phase === 'DRAGGING');

  // on lift
  {
    const expected: OnLift = {
      wasDisplaced: {
        // part of the original onLift
        [preset.inHome2.descriptor.id]: true,
        [preset.inHome3.descriptor.id]: true,
        [preset.inHome4.descriptor.id]: true,
        // added
        [added.descriptor.id]: true,
      },
      displacedBy,
    };

    expect(result.onLift).toEqual(expected);
  }

  // home impact
  {
    const displaced: Displacement[] = [
      getNotAnimatedDisplacement(preset.inHome2),
      getNotAnimatedDisplacement(preset.inHome3),
      getNotAnimatedDisplacement(preset.inHome4),
      // displaced
      getNotAnimatedDisplacement(added),
    ];
    const expected: DragImpact = {
      ...result.impact,
      movement: {
        displacedBy,
        displaced,
        map: getDisplacementMap(displaced),
      },
    };
    expect(result.onLiftImpact).toEqual(expected);
  }
});
