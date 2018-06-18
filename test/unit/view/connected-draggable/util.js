// @flow
import { type Position } from 'css-box-model';
import { add } from '../../../../src/state/position';
import getPageItemPositions from '../../../../src/state/get-page-item-positions';
import getStatePreset from '../../../utils/get-simple-state-preset';
import type {
  Selector,
  OwnProps,
  MapProps,
} from '../../../../src/view/draggable/draggable-types';
import type {
  ItemPositions,
  DraggingState,
  CollectingState,
  DropPendingState,
  DraggableDimension,
} from '../../../../src/types';

export type IsDraggingState = DraggingState | CollectingState | DropPendingState

export const move = (previous: IsDraggingState, offset: Position): IsDraggingState => {
  const client: ItemPositions = {
    offset,
    selection: add(previous.initial.client.selection, offset),
    borderBoxCenter: add(previous.initial.client.borderBoxCenter, offset),
  };
  const page: ItemPositions = getPageItemPositions(client, previous.viewport.scroll.current);

  return {
    // appeasing flow
    phase: 'DRAGGING',
    ...previous,
    // eslint-disable-next-line
    phase: previous.phase,
    current: {
      client, page,
    },
  };
};

export const getOwnProps = (dimension: DraggableDimension): OwnProps => ({
  draggableId: dimension.descriptor.id,
  index: dimension.descriptor.index,
  isDragDisabled: false,
  disableInteractiveElementBlocking: false,
  children: () => null,
});

const state = getStatePreset();

export const draggingStates: IsDraggingState[] = [
  state.dragging(),
  state.collecting(),
  state.dropPending(),
];

export const withImpact = (current: IsDraggingState, impact: DragImpact): IsDraggingState => (({
  ...current,
  impact,
}: any));
