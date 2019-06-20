// @flow
import type {
  DraggableDimension,
  DraggableId,
  DisplacementGroups,
  DraggableDescriptor,
  DraggableIdMap,
  DisplacementMap,
} from '../../src/types';

export function getDraggableIds(
  draggables: DraggableDimension[],
): DraggableId[] {
  return draggables.map(d => d.descriptor.id);
}

export function getDraggableIdMap(ids: DraggableId[]): DraggableIdMap {
  return ids.reduce((map: DraggableIdMap, id: DraggableId) => {
    map[id] = true;
    return map;
  }, {});
}

type GetDisplacedArgs = {|
  visible?: DraggableDimension[],
  invisible?: DraggableDimension[],
  shouldAnimate?: boolean,
|};

export function getDisplacementGroups({
  visible = [],
  invisible = [],
  shouldAnimate = true,
}: GetDisplacedArgs): DisplacementGroups {
  const all: DraggableId[] = [...visible, ...invisible]
    .map((item: DraggableDimension): DraggableDescriptor => item.descriptor)
    .sort((a, b) => a.index - b.index)
    .map((descriptor: DraggableDescriptor): DraggableId => descriptor.id);

  const visibleMap: DisplacementMap = visible.reduce(
    (previous: DisplacementMap, item: DraggableDimension): DisplacementMap => {
      previous[item.descriptor.id] = {
        draggableId: item.descriptor.id,
        shouldAnimate,
      };
      return previous;
    },
    {},
  );

  return {
    all,
    visible: visibleMap,
    invisible: getDraggableIdMap(invisible.map(d => d.descriptor.id)),
  };
}
