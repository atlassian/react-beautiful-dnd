// @flow
import { type Rect, type Spacing, expand, getRect } from 'css-box-model';
import type {
  DraggableId,
  Displacement,
  DraggableDimension,
  DroppableDimension,
  DisplacementMap,
  DisplacementGroups,
  DisplacedBy,
  DraggableIdMap,
} from '../types';
import { isPartiallyVisible } from './visibility/is-visible';

type Args = {|
  afterDragging: DraggableDimension[],
  destination: DroppableDimension,
  displacedBy: DisplacedBy,
  last: ?DisplacementGroups,
  viewport: Rect,
  forceShouldAnimate?: boolean,
|};

const getShouldAnimate = (
  id,
  last: ?DisplacementGroups,
  forceShouldAnimate: ?boolean,
) => {
  // Use a forced value if provided
  if (typeof forceShouldAnimate === 'boolean') {
    return forceShouldAnimate;
  }

  // nothing to gauge animation from
  if (!last) {
    return true;
  }

  const { invisible, visible } = last;

  // it was previously invisible - no animation
  if (invisible[id]) {
    return false;
  }

  const previous: ?Displacement = visible[id];

  return previous ? previous.shouldAnimate : true;
};

// Note: it is also an optimisation to not render the displacement on
// items when they are not longer visible.
// This prevents a lot of .render() calls when leaving / entering a list

function getTarget(
  draggable: DraggableDimension,
  displacedBy: DisplacedBy,
): Rect {
  const marginBox: Rect = draggable.page.marginBox;

  // ## Visibility overscanning
  // We are expanding rather than offsetting the marginBox.
  // In some cases we want
  // - the target based on the starting position (such as when dropping outside of any list)
  // - the target based on the items position without starting displacement (such as when moving inside a list)
  // To keep things simple we just expand the whole area for this check
  // The worst case is some minor redundant offscreen movements
  const expandBy: Spacing = {
    // pull backwards into viewport
    top: displacedBy.point.y,
    right: 0,
    bottom: 0,
    // pull backwards into viewport
    left: displacedBy.point.x,
  };

  return getRect(expand(marginBox, expandBy));
}

export default function getDisplacementGroups({
  afterDragging,
  destination,
  displacedBy,
  viewport,
  forceShouldAnimate,
  last,
}: Args): DisplacementGroups {
  return afterDragging.reduce(
    function process(
      groups: DisplacementGroups,
      draggable: DraggableDimension,
    ): DisplacementGroups {
      const target: Rect = getTarget(draggable, displacedBy);
      const id: DraggableId = draggable.descriptor.id;

      groups.all.push(id);

      const isVisible: boolean = isPartiallyVisible({
        target,
        destination,
        viewport,
        withDroppableDisplacement: true,
      });

      if (!isVisible) {
        groups.invisible[draggable.descriptor.id] = true;
        return groups;
      }

      // item is visible

      const shouldAnimate: boolean = getShouldAnimate(
        id,
        last,
        forceShouldAnimate,
      );

      const displacement: Displacement = {
        draggableId: id,
        shouldAnimate,
      };

      groups.visible[id] = displacement;
      return groups;
    },
    {
      all: [],
      visible: {},
      invisible: {},
    },
  );
}
