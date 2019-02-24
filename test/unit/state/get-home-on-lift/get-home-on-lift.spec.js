// @flow
import type {
  DisplacedBy,
  Displacement,
  DragImpact,
  DraggableIdMap,
  OnLift,
} from '../../../../src/types';
import getHomeOnLift from '../../../../src/state/get-home-on-lift';
import { getPreset } from '../../../utils/dimension';
import getNotAnimatedDisplacement from '../../../utils/get-displacement/get-not-animated-displacement';
import getDisplacementMap from '../../../../src/state/get-displacement-map';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import getHomeLocation from '../../../../src/state/get-home-location';

const preset = getPreset();

it('should displace everything below the dragging item', () => {
  const { impact, onLift } = getHomeOnLift({
    draggable: preset.inHome2,
    home: preset.home,
    draggables: preset.draggables,
    viewport: preset.viewport,
  });

  // originally displacement
  const displacedBy: DisplacedBy = getDisplacedBy(
    preset.home.axis,
    preset.inHome2.displaceBy,
  );

  // ordered by closest impacted
  // not animated displacement on lift
  const displaced: Displacement[] = [
    getNotAnimatedDisplacement(preset.inHome3),
    getNotAnimatedDisplacement(preset.inHome4),
  ];
  const expectedImpact: DragImpact = {
    movement: {
      displaced,
      map: getDisplacementMap(displaced),
      displacedBy,
    },
    destination: getHomeLocation(preset.inHome2.descriptor),
    merge: null,
  };

  expect(impact).toEqual(expectedImpact);

  // onLift
  const wasDisplaced: DraggableIdMap = {
    [preset.inHome3.descriptor.id]: true,
    [preset.inHome4.descriptor.id]: true,
  };
  const expectedOnLift: OnLift = {
    displacedBy,
    wasDisplaced,
  };
  expect(onLift).toEqual(expectedOnLift);
});
