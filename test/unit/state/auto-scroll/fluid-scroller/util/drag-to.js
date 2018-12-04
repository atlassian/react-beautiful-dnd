// @flow
import type { Position } from 'css-box-model';
import type {
  Viewport,
  DragImpact,
  DraggingState,
  DroppableDimension,
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

  return {
    ...base,
    // add impact if needed
    impact: impact || base.impact,
    // add droppable if needed
    dimensions: droppable
      ? patchDroppableMap(base.dimensions, droppable)
      : base.dimensions,
  };
};
