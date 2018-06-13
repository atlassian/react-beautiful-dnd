// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import { add, subtract, isEqual } from '../position';
import getDragImpact from '../get-drag-impact';
import getHomeImpact from '../get-home-impact';
import type {
  Displacement,
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
  const draggable: DraggableDimension = dimensions.draggables[critical.draggable.id];

  invariant(isEqual(draggable.client.borderBox.center, state.current.client.borderBoxCenter),
    `Collected client borderBox center: ${JSON.stringify(draggable.client.borderBox.center)}
    does not match the previously current client center: ${JSON.stringify(state.current.client.borderBoxCenter)}`
  );

  invariant(isEqual(draggable.page.borderBox.center, state.current.page.borderBoxCenter),
    `Collected page borderBox center: ${JSON.stringify(draggable.page.borderBox.center)}
    does not match the previously current page center: ${JSON.stringify(state.current.page.borderBoxCenter)}`
  );

  const oldClientBorderBoxCenter: Position = state.initial.client.borderBoxCenter;
  const newClientBorderBoxCenter: Position = draggable.client.borderBox.center;
  // How much the dragging item is shifting
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

  const offset: Position = subtract(
    // The offset before the update
    state.current.client.offset,
    // The change caused by the update
    centerDiff
  );

  const current: DragPositions = (() => {
    const client: ItemPositions = {
      selection: add(initial.client.selection, offset),
      // this will be the same as the previous borderBoxCenter
      borderBoxCenter: add(initial.client.borderBoxCenter, offset),
      offset,
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
    previousImpact: getHomeImpact(critical, dimensions),
    viewport,
  });

  // stripping out any animations
  const forcedNoAnimations: DragImpact = {
    ...impact,
    movement: {
      ...impact.movement,
      displaced: impact.movement.displaced.map((entry: Displacement) => ({
        ...entry,
        shouldAnimate: false,
      })),
    },
  };

  const draggingState: DraggingState = {
    // appeasing flow
    phase: 'DRAGGING',
    ...state,
    // eslint-disable-next-line
      phase: 'DRAGGING',
    impact: forcedNoAnimations,
    viewport,
    initial,
    current,
    dimensions,
    // Do not want to animate this impact
    shouldAnimate: false,
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
