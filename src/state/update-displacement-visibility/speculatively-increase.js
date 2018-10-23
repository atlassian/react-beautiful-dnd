// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  Displacement,
  Viewport,
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
|};

export default ({
  impact,
  viewport,
  destination,
  draggables,
  maxScrollChange,
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
    if (entry.isVisible) {
      return entry;
    }

    const result: Displacement = getDisplacement({
      draggable: draggables[entry.draggableId],
      destination: scrolledDroppable,
      previousImpact: impact,
      viewport: scrolledViewport.frame,
    });

    if (!result.isVisible) {
      return entry;
    }

    // speculatively visible!
    return {
      draggableId: entry.draggableId,
      isVisible: true,
      // force skipping animation
      shouldAnimate: false,
    };
  });

  return withNewDisplacement(impact, updated);
};
