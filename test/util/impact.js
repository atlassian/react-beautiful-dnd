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

type VisibleEntry = {|
  dimension: DraggableDimension,
  shouldAnimate?: boolean,
|};

type GetDisplacedArgs = {|
  visible?: VisibleEntry[],
  invisible?: DraggableDimension[],
|};

export function getForcedDisplacement({
  visible = [],
  invisible = [],
}: GetDisplacedArgs): DisplacementGroups {
  const all: DraggableId[] = [
    ...visible.map(
      (entry: VisibleEntry): DraggableDimension => entry.dimension,
    ),
    ...invisible,
  ]
    .map((item: DraggableDimension): DraggableDescriptor => item.descriptor)
    .sort((a, b) => a.index - b.index)
    .map((descriptor: DraggableDescriptor): DraggableId => descriptor.id);

  const visibleMap: DisplacementMap = visible.reduce(
    (previous: DisplacementMap, entry: VisibleEntry): DisplacementMap => {
      const descriptor: DraggableDescriptor = entry.dimension.descriptor;
      previous[descriptor.id] = {
        draggableId: descriptor.id,
        // defaulting to true
        shouldAnimate:
          typeof entry.shouldAnimate === 'boolean' ? entry.shouldAnimate : true,
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
