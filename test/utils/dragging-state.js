// @flow
import { type Position } from 'css-box-model';
import { add } from '../../src/state/position';
import getPageItemPositions from '../../src/state/get-page-item-positions';
import getStatePreset from './get-simple-state-preset';
import type {
  ItemPositions,
  DraggingState,
  CollectingState,
  DropPendingState,
  DragImpact,
  DropAnimatingState,
  PendingDrop,
} from '../../src/types';

const state = getStatePreset();

export type IsDraggingState =
  | DraggingState
  | CollectingState
  | DropPendingState;

export const draggingStates: IsDraggingState[] = [
  state.dragging(),
  state.collecting(),
  state.dropPending(),
];

export const withImpact = (
  current: IsDraggingState,
  impact: DragImpact,
): IsDraggingState =>
  ({
    ...current,
    impact,
  }: any);

export const withPending = (
  current: DropAnimatingState,
  pending: PendingDrop,
): DropAnimatingState => ({
  ...current,
  pending,
});

export const move = (
  previous: IsDraggingState,
  offset: Position,
): IsDraggingState => {
  const client: ItemPositions = {
    offset,
    selection: add(previous.initial.client.selection, offset),
    borderBoxCenter: add(previous.initial.client.borderBoxCenter, offset),
  };
  const page: ItemPositions = getPageItemPositions(
    client,
    previous.viewport.scroll.current,
  );

  return {
    // appeasing flow
    phase: 'DRAGGING',
    ...previous,
    // eslint-disable-next-line
    phase: previous.phase,
    current: {
      client,
      page,
    },
  };
};
