// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  Displacement,
  Viewport,
} from '../../../../types';
import scrollViewport from '../../../scroll-viewport';
import scrollDroppable from '../../../droppable/scroll-droppable';
import getDisplacement from '../../../get-displacement';
import getDisplacementMap from '../../../get-displacement-map';
import { add } from '../../../position';

const withNewDisplacement = (
  impact: DragImpact,
  displaced: Displacement[],
): DragImpact => ({
  ...impact,
  movement: {
    ...impact.movement,
    displaced,
    map: getDisplacementMap(displaced),
  },
});

type SpeculativeArgs = {|
  impact: DragImpact,
  destination: DroppableDimension,
  viewport: Viewport,
  draggables: DraggableDimensionMap,
  maxScrollChange: Position,
|};

export const speculativelyIncrease = ({
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
    console.log(entry.draggableId, 'SPECULATIVELY INCREASED');
    return {
      draggableId: entry.draggableId,
      isVisible: true,
      // force skipping animation
      shouldAnimate: false,
    };
  });

  return withNewDisplacement(impact, updated);
};

type RecomputeArgs = {|
  impact: DragImpact,
  destination: DroppableDimension,
  viewport: Viewport,
  draggables: DraggableDimensionMap,
|};

export const recompute = ({
  impact,
  viewport,
  destination,
  draggables,
}: RecomputeArgs): DragImpact => {
  const updated: Displacement[] = impact.movement.displaced.map(
    (entry: Displacement) =>
      getDisplacement({
        draggable: draggables[entry.draggableId],
        destination,
        previousImpact: impact,
        viewport: viewport.frame,
      }),
  );

  return withNewDisplacement(impact, updated);
};
