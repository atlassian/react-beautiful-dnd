// @flow
import type { Position } from 'css-box-model';
import { add, subtract } from '../position';
import getDragImpact from '../get-drag-impact';
import type {
  BulkCollectionState,
  DropPendingState,
  DraggingState,
  DraggableDimension,
  Critical,
  DimensionMap,
  Viewport,
  DragImpact,
  DragPositions,
  ItemPositions,
} from '../../types';
import type { Result } from './bulk-replace-types';

type Args = {|
  state: BulkCollectionState | DropPendingState,
  viewport: Viewport,
  critical: Critical,
  dimensions: DimensionMap,
|}

const origin: Position = { x: 0, y: 0 };

export default ({
  state,
  viewport,
  critical,
  dimensions,
}: Args): Result => {
  const oldClientBorderBoxCenter: Position = state.initial.client.borderBoxCenter;
  const draggable: DraggableDimension = dimensions.draggables[critical.draggable.id];
  const newClientBorderBoxCenter: Position = draggable.client.borderBox.center;
  const centerDiff: Position = subtract(newClientBorderBoxCenter, oldClientBorderBoxCenter);

  const oldInitialClientSelection: Position = state.initial.client.selection;
  const newInitialClientSelection: Position = add(oldInitialClientSelection, centerDiff);

  // Need to figure out what the initial and current positions should be
  const initial: DragPositions = {
    client: {
      selection: newInitialClientSelection,
      borderBoxCenter: newClientBorderBoxCenter,
      offset: origin,
    },
    page: {
      selection: add(newInitialClientSelection, viewport.scroll.initial),
      borderBoxCenter: add(newClientBorderBoxCenter, viewport.scroll.initial),
      offset: add(origin, viewport.scroll.initial),
    },
  };

  const newCurrentOffset: Position = subtract(state.current.client.offset, centerDiff);

  const current: DragPositions = (() => {
    const client: ItemPositions = {
      selection: add(initial.client.selection, newCurrentOffset),
      borderBoxCenter: add(initial.client.borderBoxCenter, newCurrentOffset),
      offset: newCurrentOffset,
    };
    const page: ItemPositions = {
      selection: add(client.selection, viewport.scroll.current),
      borderBoxCenter: add(client.borderBoxCenter, viewport.scroll.current),
      offset: add(client.offset, viewport.scroll.current),
    };
    return { client, page };
  })();

  const impact: DragImpact = getDragImpact({
    pageBorderBoxCenter: current.page.borderBoxCenter,
    draggable: dimensions.draggables[critical.draggable.id],
    draggables: dimensions.draggables,
    droppables: dimensions.droppables,
    previousImpact: state.impact,
    viewport,
  });

  const draggingState: DraggingState = {
    // appeasing flow
    phase: 'DRAGGING',
    ...state,
    // eslint-disable-next-line
      phase: 'DRAGGING',
    impact,
    viewport,
    initial,
    current,
    dimensions,
  };

  if (state.phase === 'BULK_COLLECTING') {
    return draggingState;
  }

  // There was a DROP_PENDING
  // Staying in the DROP_PENDING phase
  // setting isWaiting for false

  const dropPending: DropPendingState = {
    // appeasing flow
    phase: 'DROP_PENDING',
    ...draggingState,
    // eslint-disable-next-line
      phase: 'DROP_PENDING',
    // No longer waiting
    reason: state.reason,
    isWaiting: false,
  };

  return dropPending;
};
