// @flow
import { createBox, type BoxModel, type Position } from 'css-box-model';
import { getPreset, addDroppable, makeVirtual } from '../../../util/dimension';
import type {
  Published,
  DraggableDimension,
  DroppableDimension,
  CollectingState,
  LiftEffect,
} from '../../../../src/types';
import offsetDraggable from '../../../../src/state/publish-while-dragging-in-virtual/offset-draggable';

const preset = getPreset();

export const empty: Published = {
  additions: [],
  removals: [],
  modified: [],
};

type ShiftArgs = {|
  draggable: DraggableDimension,
  change: Position,
  newIndex: number,
|};

export const shift = ({
  draggable,
  change,
  newIndex,
}: ShiftArgs): DraggableDimension => {
  const moved: DraggableDimension = offsetDraggable({
    draggable,
    offset: change,
    initialWindowScroll: preset.windowScroll,
  });

  const result: DraggableDimension = {
    ...moved,
    descriptor: {
      ...moved.descriptor,
      index: newIndex,
    },
  };

  return result;
};

export const virtualHome: DroppableDimension = makeVirtual(preset.home);
export const virtualForeign: DroppableDimension = makeVirtual(preset.foreign);

export const withVirtuals = (state: CollectingState): CollectingState => {
  // $ExpectError
  const base: CollectingState = addDroppable(
    // $ExpectError
    addDroppable(state, virtualHome),
    virtualForeign,
  );
  const afterCritical: LiftEffect = {
    ...base.afterCritical,
    inVirtualList: true,
  };
  return {
    ...base,
    afterCritical,
  };
};

export const adjustBox = (box: BoxModel, point: Position): BoxModel =>
  createBox({
    borderBox: {
      // top and left cannot change as a result of this adjustment
      top: box.borderBox.top,
      left: box.borderBox.left,
      // only growing in one direction
      right: box.borderBox.right + point.x,
      bottom: box.borderBox.bottom + point.y,
    },
    margin: box.margin,
    border: box.border,
    padding: box.padding,
  });
