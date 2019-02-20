// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  Viewport,
  Axis,
  DragImpact,
  DisplacedBy,
  Displacement,
} from '../../../../../src/types';
import { vertical, horizontal } from '../../../../../src/state/axis';
import { add, negate, subtract } from '../../../../../src/state/position';
import scrollDroppable from '../../../../../src/state/droppable/scroll-droppable';
import { getPreset, makeScrollable } from '../../../../utils/dimension';
import getClientBorderBoxCenter from '../../../../../src/state/get-center-from-impact/get-client-border-box-center';
import getDisplacedBy from '../../../../../src/state/get-displaced-by';
import { forward } from '../../../../../src/state/user-direction/user-direction-preset';
import noImpact from '../../../../../src/state/no-impact';
import scrollViewport from '../../../../../src/state/scroll-viewport';
import getHomeOnLift from '../../../../../src/state/get-home-on-lift';
import getDisplacementMap from '../../../../../src/state/get-displacement-map';
import getNotAnimatedDisplacement from '../../../../utils/get-displacement/get-not-animated-displacement';

[vertical, horizontal].forEach((axis: Axis) => {
  const preset = getPreset();
  const { onLift, impact: homeImpact } = getHomeOnLift({
    draggable: preset.inHome1,
    draggables: preset.draggables,
    home: preset.home,
    viewport: preset.viewport,
  });

  it('should account for a collapsing dragging item when combining', () => {
    const { onLift, impact: homeImpact } = getHomeOnLift({
      draggable: preset.inHome1,
      draggables: preset.draggables,
      home: preset.home,
      viewport: preset.viewport,
    });
    const mergingWithInHome2: DragImpact = {
      ...homeImpact,
      destination: null,
      merge: {
        whenEntered: forward,
        combine: {
          droppableId: preset.home.descriptor.id,
          draggableId: preset.inHome2.descriptor.id,
        },
      },
    };
  });
});
