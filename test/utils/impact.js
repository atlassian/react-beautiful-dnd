// @flow
import invariant from 'tiny-invariant';
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
  animation?: boolean[],
|};

export function getForcedDisplacement({
  visible = [],
  invisible = [],
  animation,
}: GetDisplacedArgs): DisplacementGroups {
  const all: DraggableId[] = [...visible, ...invisible]
    .map((item: DraggableDimension): DraggableDescriptor => item.descriptor)
    .sort((a, b) => a.index - b.index)
    .map((descriptor: DraggableDescriptor): DraggableId => descriptor.id);

  if (animation) {
    invariant(
      animation.length === visible.length,
      'animation array needs to be the same lenght as the visible',
    );
  }

  const visibleMap: DisplacementMap = visible.reduce(
    (
      previous: DisplacementMap,
      item: DraggableDimension,
      index,
    ): DisplacementMap => {
      previous[item.descriptor.id] = {
        draggableId: item.descriptor.id,
        // defaulting to true
        shouldAnimate: animation ? animation[index] : true,
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
