// @flow
import invariant from 'invariant';
import type { Position } from 'css-box-model';
import { isEqual, subtract, add } from '../position';
import getPageItemPositions from '../get-page-item-positions';
import type {
  DragPositions,
  Viewport,
  ItemPositions,
} from '../../types';

type Args = {|
  initial: DragPositions,
  current: DragPositions,
  oldClientBorderBoxCenter: Position,
  newClientBorderBoxCenter: Position,
  viewport: Viewport,
|}

type Result = {|
  initial: DragPositions,
  current: DragPositions,
|}

const origin: Position = { x: 0, y: 0 };

export default ({
  initial: oldInitial,
  current: oldCurrent,
  oldClientBorderBoxCenter,
  newClientBorderBoxCenter,
  viewport,
}: Args): Result => {
  // Nothing needs to be changed
  if (isEqual(oldClientBorderBoxCenter, newClientBorderBoxCenter)) {
    return { initial: oldInitial, current: oldCurrent };
  }

  // how much the dragging item has shifted
  const centerDiff: Position = subtract(newClientBorderBoxCenter, oldClientBorderBoxCenter);
  // const displacement: Position = negate(centerDiff);

  const clientSelection: Position = add(
    oldInitial.client.selection, centerDiff
  );

  const initial: DragPositions = (() => {
    const client: ItemPositions = {
      selection: clientSelection,
      borderBoxCenter: newClientBorderBoxCenter,
      offset: origin,
    };

    return {
      client,
      page: getPageItemPositions(client, viewport.scroll.initial),
    };
  })();

  const offset: Position = subtract(
    // The offset before the update
    oldCurrent.client.offset,
    // The change caused by the update
    centerDiff,
  );

  const current: DragPositions = (() => {
    const client: ItemPositions = {
      selection: add(initial.client.selection, offset),
      // this should be the same as the previous client borderBox center
      borderBoxCenter: add(initial.client.borderBoxCenter, offset),
      offset,
    };

    invariant(
      isEqual(oldCurrent.client.borderBoxCenter, client.borderBoxCenter),
      `
        Incorrect new client center position.
        Expected ${JSON.stringify(oldCurrent.client.borderBoxCenter)}
        to equal ${JSON.stringify(client.borderBoxCenter)}
      `
    );

    return {
      client,
      page: getPageItemPositions(client, viewport.scroll.current),
    };
  })();

  return { current, initial };
};

