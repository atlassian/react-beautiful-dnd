// @flow
import invariant from 'tiny-invariant';
import type { DraggableId } from '../../types';
import { draggable as attr } from '../data-attributes';
import { deserialize, type DraggableOptions } from '../draggable-options';

export type DraggableData = {|
  id: DraggableId,
  ...DraggableOptions,
|};

export default function getDataFromDraggable(
  draggable: Element,
): DraggableData {
  const id: ?DraggableId = draggable.getAttribute(`${attr.id}`);
  invariant(id != null, 'Expected element to be a draggable');

  const options: ?string = draggable.getAttribute(`${attr.options}`);
  invariant(options, 'Expected draggable to have options');

  return {
    id,
    ...deserialize(options),
  };
}
