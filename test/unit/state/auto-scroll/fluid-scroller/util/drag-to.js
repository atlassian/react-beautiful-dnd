// @flow
import type { Position } from 'css-box-model';
import type {
  Viewport,
  DragImpact,
  DraggingState,
} from '../../../../../../src/types';

type DragToArgs = {|
  selection: Position,
  viewport: Viewport,
  state: Object,
  impact?: DragImpact,
|};

export default ({
  selection,
  viewport,
  // seeding that we are over the home droppable
  impact,
  state,
}: DragToArgs): DraggingState => {
  const base: DraggingState = state.dragging(
    state.preset.inHome1.descriptor.id,
    selection,
    viewport,
  );

  return {
    ...base,
    impact: impact || base.impact,
  };
};
