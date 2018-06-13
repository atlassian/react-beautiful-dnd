// @flow
import type {
  DraggableId,
  DroppableId,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DimensionMap,
  DraggableDimension,
  DroppableDimension,
} from '../../types';

type Args = {|
  getDraggableDimension: (id: DraggableId) => DraggableDimension,
  getDroppableDimension: (id: DroppableId) => DroppableDimension,
  publish: (map: DimensionMap) => void,
|}

type Collector = {|
  collectDraggable: (id: DraggableId) => void,
  collectDroppable: (id: DroppableId) => void,
|}

type ToCollect = {|
  draggables: DraggableId[],
  droppables: DroppableId[],
|}

const toMap = array => array.reduce((previous, current) => {
  previous[current.descriptor.id] = current;
  return previous;
}, {});

export default ({
  getDraggableDimension,
  getDroppableDimension,
  publish,
}: Args): Collector => {
  const toCollect: ToCollect = {
    draggables: [],
    droppables: [],
  };
  let frameId: ?AnimationFrameID = null;

  const collect = () => {
    if (frameId) {
      return;
    }

    frameId = requestAnimationFrame(() => {
      frameId = null;
      const draggables: DraggableDimensionMap = toMap(
        toCollect.draggables.map((id: DraggableId): DraggableDimension => getDraggableDimension(id))
      );

      const droppables: DroppableDimensionMap = toMap(
        toCollect.droppables.map((id: DroppableId): DroppableDimension => getDroppableDimension(id))
      );

      const dimensions: DimensionMap = { draggables, droppables };

      // reset toCollect
      toCollect.draggables.length = 0;
      toCollect.droppables.length = 0;

      publish(dimensions);
    });
  };

  const collectDraggable = (id: DraggableId) => {
    toCollect.draggables.push(id);
    collect();
  };

  const collectDroppable = (id: DroppableId) => {
    toCollect.droppables.push(id);
    collect();
  };

  return { collectDraggable, collectDroppable };
};

