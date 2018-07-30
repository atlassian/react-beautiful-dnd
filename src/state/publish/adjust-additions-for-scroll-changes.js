// @flow
import invariant from 'tiny-invariant';
import {
  offset,
  withScroll,
  type Position,
  type BoxModel,
} from 'css-box-model';
import { origin, add, subtract } from '../position';
import { toDroppableMap } from '../dimension-structures';
import type {
  Published,
  Viewport,
  DraggableDimension,
  DroppableDimension,
  Scrollable,
  DroppableDimensionMap,
  DroppableId,
} from '../../types';

type Args = {|
  droppables: DroppableDimensionMap,
  published: Published,
  viewport: Viewport,
|};

type ChangeArgs = {|
  original: DroppableDimension,
  modified: DroppableDimension,
|};

const getDroppableScrollChange = ({
  original,
  modified,
}: ChangeArgs): Position => {
  const oldScrollable: ?Scrollable = original.viewport.closestScrollable;

  // original droppable was not scrollable
  if (!oldScrollable) {
    return origin;
  }

  // the new scollable will have the latest scroll - which can be different
  // from the current scroll as stored in the droppable due to pending scroll changes
  const newScrollable: ?Scrollable = modified.viewport.closestScrollable;
  invariant(
    newScrollable,
    'Cannot get droppable scroll change from modified droppable',
  );

  const diff: Position = subtract(
    newScrollable.scroll.current,
    oldScrollable.scroll.initial,
  );

  return diff;

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

  // return oldScrollable.scroll.diff.value;
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
  const modifiedMap: DroppableDimensionMap = toDroppableMap(published.modified);

  const shifted: DraggableDimension[] = published.additions.map(
    (draggable: DraggableDimension): DraggableDimension => {
      const droppableId: DroppableId = draggable.descriptor.droppableId;
      const original: DroppableDimension = droppables[droppableId];
      const modified: DroppableDimension = modifiedMap[droppableId];

      const droppableScrollChange: Position = getDroppableScrollChange({
        original,
        modified,
      });

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
