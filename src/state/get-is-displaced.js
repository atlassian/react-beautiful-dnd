// @flow
import type { DisplacementGroups, DraggableId } from '../types';

type Args = {|
  displaced: DisplacementGroups,
  id: DraggableId,
|};

export default function getIsDisplaced({ displaced, id }: Args): boolean {
  return Boolean(displaced.visible[id] || displaced.invisible[id]);
}
