// @flow
import invariant from 'tiny-invariant';
import type { DraggableId } from '../../types';
import { draggable as attr } from '../data-attributes';
import { find } from '../../native-with-fallback';

export type DraggableData = {|
  id: DraggableId,
  canDragInteractiveElements: boolean,
  shouldRespectForcePress: boolean,
  isEnabled: boolean,
|};

export default function getDraggableData(draggable: Element): DraggableData {
  const id: ?DraggableId = draggable.getAttribute(`${attr.id}`);
  invariant(id != null, 'Expected element to be a draggable');

  const options: ?string = draggable.getAttribute(`${attr.options}`);
  invariant(options, 'Expected draggable to have options');

  const parsed: Object = JSON.parse(options);

  // validation in dev
  if (process.env.NODE_ENV !== 'production') {
    const properties: string[] = [
      'canDragInteractiveElements',
      'shouldRespectForcePress',
      'isEnabled',
    ];
    const keys: string[] = Object.keys(parsed);

    const arrange = (list: string[]): string => list.sort().join(',');

    invariant(
      arrange(properties) === arrange(keys),
      `
      Unexpected data keys.
      Expected: ${arrange(properties)}
      Actual: ${arrange(keys)}
    `,
    );

    invariant(
      keys.length === properties.length,
      'Unexpected parsed draggable options',
    );
    properties.forEach((property: string) => {
      invariant(
        find(keys, (key: string) => property === key),
        `Could not find key ${property} in draggable attributes`,
      );
    });
  }

  return {
    id,
    canDragInteractiveElements: parsed.canDragInteractiveElements,
    shouldRespectForcePress: parsed.shouldRespectForcePress,
    isEnabled: parsed.isEnabled,
  };
}
