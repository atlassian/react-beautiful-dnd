// @flow
import { type Rect, type Spacing, expand, getRect } from 'css-box-model';
import type {
  DisplacementGroups,
  DisplacedBy,
  DroppableDimension,
  DraggableDimension,
  ImpactLocation,
  Viewport,
} from '../types';
import { emptyGroups } from './no-impact';
import getDisplacementGroups from './get-displacement-groups';

type Args = {|
  draggable: DraggableDimension,
  destination: DroppableDimension,
  displacedBy: DisplacedBy,
  at: ?ImpactLocation,
  withoutDragging: DraggableDimension[],
  last: DisplacementGroups,
  viewport: Viewport,
|};

export default ({
  withoutDragging,
  destination,
  displacedBy,
  at,
  last,
  viewport,
}: Args): DisplacementGroups => {
  if (!at) {
    return emptyGroups;
  }

  if (at.type === 'REORDER') {
    const impacted: DraggableDimension[] = withoutDragging.slice(
      at.destination.index,
    );

    const displaced: DisplacementGroups = getDisplacementGroups({
      afterDragging: impacted,
      destination,
      displacedBy,
      last,
      viewport: viewport.frame,
    });

    return displaced;
  }

  // combining
  // TODO: recompute visiblity
  return last;
};
