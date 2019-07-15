// @flow
import type { Position } from 'css-box-model';
import type {
  DraggableId,
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
  DragImpact,
  Displacement,
  DisplacementGroups,
  DraggableIdMap,
  DisplacementMap,
  Viewport,
} from '../../types';
import scrollViewport from '../scroll-viewport';
import scrollDroppable from '../droppable/scroll-droppable';
import { add } from '../position';
import getDisplacementGroups from '../get-displacement-groups';

type SpeculativeArgs = {|
  impact: DragImpact,
  destination: DroppableDimension,
  viewport: Viewport,
  draggables: DraggableDimensionMap,
  maxScrollChange: Position,
|};

function getDraggables(
  ids: DraggableId[],
  draggables: DraggableDimensionMap,
): DraggableDimension[] {
  return ids.map((id: DraggableId): DraggableDimension => draggables[id]);
}

function tryGetVisible(
  id: DraggableId,
  groups: DisplacementGroups[],
): ?Displacement {
  for (let i = 0; i < groups.length; i++) {
    const displacement: ?Displacement = groups[i].visible[id];
    if (displacement) {
      return displacement;
    }
  }
  return null;
}

export default ({
  impact,
  viewport,
  destination,
  draggables,
  maxScrollChange,
}: SpeculativeArgs): DragImpact => {
  const scrolledViewport: Viewport = scrollViewport(
    viewport,
    add(viewport.scroll.current, maxScrollChange),
  );
  const scrolledDroppable: DroppableDimension = destination.frame
    ? scrollDroppable(
        destination,
        add(destination.frame.scroll.current, maxScrollChange),
      )
    : destination;

  const last: DisplacementGroups = impact.displaced;
  const withViewportScroll: DisplacementGroups = getDisplacementGroups({
    afterDragging: getDraggables(last.all, draggables),
    destination,
    displacedBy: impact.displacedBy,
    viewport: scrolledViewport.frame,
    last,
    // we want the addition to be animated
    forceShouldAnimate: true,
  });
  const withDroppableScroll: DisplacementGroups = getDisplacementGroups({
    afterDragging: getDraggables(last.all, draggables),
    destination: scrolledDroppable,
    displacedBy: impact.displacedBy,
    viewport: viewport.frame,
    last,
    // we want the addition to be animated
    forceShouldAnimate: true,
  });

  const invisible: DraggableIdMap = {};
  const visible: DisplacementMap = {};
  const groups: DisplacementGroups[] = [
    // this will populate the previous entries with the correct animation values
    last,
    withViewportScroll,
    withDroppableScroll,
  ];

  last.all.forEach((id: DraggableId) => {
    const displacement: ?Displacement = tryGetVisible(id, groups);

    if (displacement) {
      visible[id] = displacement;
      return;
    }
    invisible[id] = true;
  });

  const newImpact: DragImpact = {
    ...impact,
    displaced: { all: last.all, invisible, visible },
  };

  return newImpact;
};
