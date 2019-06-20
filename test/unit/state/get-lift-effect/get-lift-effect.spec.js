// @flow
import type {
  DisplacedBy,
  DraggableDimension,
  DragImpact,
  LiftEffect,
} from '../../../../src/types';
import getLiftEffect from '../../../../src/state/get-lift-effect';
import { getPreset } from '../../../utils/dimension';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import getHomeLocation from '../../../../src/state/get-home-location';
import {
  getDisplacementGroups,
  getDraggableIdMap,
  getDraggableIds,
} from '../../../utils/impact';

const preset = getPreset();

it('should mark everything after the critical ', () => {
  const { impact, afterCritical } = getLiftEffect({
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
  const all: DraggableDimension[] = [preset.inHome3, preset.inHome4];

  {
    const expected: LiftEffect = {
      inVirtualList: false,
      effected: getDraggableIdMap(getDraggableIds(all)),
      displacedBy,
    };
    expect(afterCritical).toEqual(expected);
  }
  {
    const expected: DragImpact = {
      displaced: getDisplacementGroups({ visible: all, shouldAnimate: false }),
      displacedBy,
      at: {
        type: 'REORDER',
        destination: getHomeLocation(preset.inHome2.descriptor),
      },
    };
    expect(impact).toEqual(expected);
  }
});
