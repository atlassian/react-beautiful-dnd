// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
  DragImpact,
  Displacement,
  Viewport,
  OnLift,
} from '../../types';
import scrollViewport from '../scroll-viewport';
import scrollDroppable from '../droppable/scroll-droppable';
import { add } from '../position';
import getDisplacement from '../get-displacement';
import withNewDisplacement from './with-new-displacement';

type SpeculativeArgs = {|
  impact: DragImpact,
  destination: DroppableDimension,
  viewport: Viewport,
  draggables: DraggableDimensionMap,
  maxScrollChange: Position,
  onLift: OnLift,
|};

export default ({
  impact,
  viewport,
  destination,
  draggables,
  maxScrollChange,
  onLift,
}: SpeculativeArgs): DragImpact => {
  const displaced: Displacement[] = impact.movement.displaced;

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

  const updated: Displacement[] = displaced.map((entry: Displacement) => {
    // already visible: do not need to speculatively increase
    if (entry.isVisible) {
      return entry;
    }

    const draggable: DraggableDimension = draggables[entry.draggableId];

    // check if would be visibly displaced in a scrolled droppable or viewport

    const withScrolledViewport: Displacement = getDisplacement({
      draggable,
      destination,
      previousImpact: impact,
      viewport: scrolledViewport.frame,
      onLift,
      forceShouldAnimate: false,
    });

    if (withScrolledViewport.isVisible) {
      return withScrolledViewport;
    }

    const withScrolledDroppable: Displacement = getDisplacement({
      draggable,
      destination: scrolledDroppable,
      previousImpact: impact,
      viewport: viewport.frame,
      onLift,
      forceShouldAnimate: false,
    });

    if (withScrolledDroppable.isVisible) {
      return withScrolledDroppable;
    }

    // still not visible
    return entry;
  });

  return withNewDisplacement(impact, updated);
};
