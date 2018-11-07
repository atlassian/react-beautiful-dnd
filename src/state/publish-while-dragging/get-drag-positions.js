// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import { isEqual, subtract, add, origin, negate } from '../position';
import type {
  DragPositions,
  Viewport,
  ClientPositions,
  PagePositions,
} from '../../types';

type Args = {|
  initial: DragPositions,
  current: DragPositions,
  oldClientBorderBoxCenter: Position,
  newClientBorderBoxCenter: Position,
  viewport: Viewport,
|};

type Result = {|
  initial: DragPositions,
  current: DragPositions,
|};

export default ({
  initial: oldInitial,
  current: oldCurrent,
  oldClientBorderBoxCenter,
  newClientBorderBoxCenter,
  viewport,
}: Args): Result => {
  // TODO: what about page shifts?

  // how much the dragging item has shifted in the DOM
  const shift: Position = subtract(
    newClientBorderBoxCenter,
    oldClientBorderBoxCenter,
  );

  // Correcting its new original position
  const initial: DragPositions = (() => {
    const client: ClientPositions = {
      selection: add(oldInitial.client.selection, shift),
      borderBoxCenter: newClientBorderBoxCenter,
      offset: origin,
    };
    const page: PagePositions = {
      selection: add(client.selection, viewport.scroll.initial),
      borderBoxCenter: add(client.selection, viewport.scroll.initial),
    };

    return {
      client,
      page,
    };
  })();

  const current: DragPositions = (() => {
    // We need to undo the shift to keep the dragging item
    // in the same visual spot
    const reverse: Position = negate(shift);
    const offset: Position = add(oldCurrent.client.offset, reverse);

    const client: ClientPositions = {
      selection: add(initial.client.selection, offset),
      // this should be the same as the previous client borderBox center
      borderBoxCenter: add(initial.client.borderBoxCenter, offset),
      offset,
    };
    const page: PagePositions = {
      selection: add(client.selection, viewport.scroll.current),
      // this should be the same as the previous client borderBox center
      borderBoxCenter: add(client.borderBoxCenter, viewport.scroll.current),
    };

    invariant(
      isEqual(oldCurrent.client.borderBoxCenter, client.borderBoxCenter),
      `
        Incorrect new client center position.
        Expected (${oldCurrent.client.borderBoxCenter.x}, ${
        oldCurrent.client.borderBoxCenter.y
      })
        to equal (${client.borderBoxCenter.x}, ${client.borderBoxCenter.y})
      `,
    );

    return {
      client,
      page,
    };
  })();

  return { current, initial };
};
