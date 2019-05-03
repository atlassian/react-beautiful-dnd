// @flow
import invariant from 'tiny-invariant';
import type { DraggableId } from '../../types';
import { draggable as attr } from '../data-attributes';

export type DraggableData = {|
  id: DraggableId,
  canDragInteractiveElements: boolean,
  shouldRespectForcePress: boolean,
|};

export default function getDraggableData(draggable: Element): DraggableData {
  const id: ?DraggableId = draggable.getAttribute(`${attr.id}`);
  invariant(id != null, 'Expected element to be a draggable');

  const options: ?string = draggable.getAttribute(`${attr.options}`);
  invariant(options, 'Expected draggable to have options');

  const parsed: Object = JSON.parse(options);

  if (process.env.NODE_ENV !== 'production') {
    invariant(
      Object.keys(parsed).length === 2,
      'Unexpected parsed draggable options',
    );
    Object.prototype.hasOwnProperty.call(parsed, 'canDragInteractiveElements');
    Object.prototype.hasOwnProperty.call(parsed, 'shouldRespectForcePress');
  }

  return {
    id,
    canDragInteractiveElements: parsed.canDragInteractiveElements,
    shouldRespectForcePress: parsed.shouldRespectForcePress,
  };
}
