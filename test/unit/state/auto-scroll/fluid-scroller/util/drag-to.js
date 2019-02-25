// @flow
import type { Position } from 'css-box-model';
import type {
  Viewport,
  DragImpact,
  DraggingState,
  DroppableDimension,
  DimensionMap,
} from '../../../../../../src/types';
import patchDroppableMap from '../../../../../../src/state/patch-droppable-map';

type DragToArgs = {|
  selection: Position,
  viewport: Viewport,
  state: Object,
  impact?: DragImpact,
  droppable?: DroppableDimension,
|};

export default ({
  selection,
  viewport,
  // seeding that we are over the home droppable
  impact,
  state,
  droppable,
}: DragToArgs): DraggingState => {
  const base: DraggingState = state.dragging(
    state.preset.inHome1.descriptor.id,
    selection,
    viewport,
  );

  const dimensions: DimensionMap = (() => {
    if (!droppable) {
      return base.dimensions;
    }
    return {
      draggables: base.dimensions.draggables,
      droppables: patchDroppableMap(base.dimensions.droppables, droppable),
    };
  })();

  return {
    ...base,
    // add impact if needed
    impact: impact || base.impact,
    // add droppable if needed
    dimensions,
  };
};
