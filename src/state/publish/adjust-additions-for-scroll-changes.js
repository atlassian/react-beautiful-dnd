// @flow
import {
  offset,
  withScroll,
  type Position,
  type BoxModel,
} from 'css-box-model';
import { origin, add } from '../position';
import type {
  Published,
  Viewport,
  DraggableDimension,
  DroppableDimension,
  Scrollable,
  DroppableDimensionMap,
} from '../../types';

type Args = {|
  droppables: DroppableDimensionMap,
  published: Published,
  viewport: Viewport,
|};

const getDroppableScrollChange = (
  droppables: DroppableDimensionMap,
  draggable: DraggableDimension,
): Position => {
  const droppable: ?DroppableDimension =
    droppables[draggable.descriptor.droppableId];

  // might be being added to a new droppable
  if (!droppable) {
    return origin;
  }

  const scrollable: ?Scrollable = droppable.viewport.closestScrollable;

  if (!scrollable) {
    return origin;
  }

  // TODO: the shift is wrong as it does not account for the additional shift
  // caused by the bulk add of additions!
  // Going to try to recapture the droppable

  // if (isEqual(scrollable.scroll.diff.value, origin)) {
  //   return origin;
  // }

  // const size: Position = patch(
  //   droppable.axis.line,
  //   draggable.client.marginBox[droppable.axis.size],
  // );

  // // the scroll of the droppable has been impacted by the addition
  // return add(scrollable.scroll.diff.value, size);

  return scrollable.scroll.diff.value;
};

export default ({ published, droppables, viewport }: Args): Published => {
  // We need to adjust collected draggables so that they
  // match the model we had when the drag started.
  // When a draggable is dynamically collected it does not have
  // the same relative client position. We need to unwind
  // any changes in window scroll and droppable scroll so that
  // the newly collected draggables fit in with our other draggables
  // and give the same dimensions that would have had if they were
  // collected at the start of the drag.

  // Need to undo the displacement caused by window scroll changes
  const windowScrollChange: Position = viewport.scroll.diff.value;

  const shifted: DraggableDimension[] = published.additions.map(
    (draggable: DraggableDimension): DraggableDimension => {
      const droppableScrollChange: Position = getDroppableScrollChange(
        droppables,
        draggable,
      );

      const totalChange: Position = add(
        windowScrollChange,
        droppableScrollChange,
      );
      const client: BoxModel = offset(draggable.client, totalChange);
      const page: BoxModel = withScroll(client, viewport.scroll.initial);

      const moved: DraggableDimension = {
        ...draggable,
        placeholder: {
          ...draggable.placeholder,
          client,
        },
        client,
        page,
      };

      return moved;
    },
  );

  const updated: Published = {
    ...published,
    additions: shifted,
  };

  return updated;
};
