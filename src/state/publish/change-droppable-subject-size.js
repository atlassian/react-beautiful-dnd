// @flow
import invariant from 'tiny-invariant';
import {
  withScroll,
  createBox,
  type Position,
  type BoxModel,
  type Spacing,
  type Rect,
} from 'css-box-model';
import { isEqual } from '../spacing';
import { toDroppableMap } from '../dimension-structures';
import {
  getDroppableDimension,
  type Closest,
  scrollDroppable,
} from '../droppable-dimension';
import type {
  DroppableDimension,
  DroppableDimensionMap,
  Scrollable,
} from '../../types';

const expandBorderBox = (old: Rect, fresh: Rect): Spacing => ({
  top: old.top,
  left: old.left,
  // this is the main logic of this file - the size adjustment
  right: old.left + fresh.width,
  bottom: old.top + fresh.height,
});

const throwIfSpacingChange = (old: BoxModel, fresh: BoxModel) => {
  if (process.env.NODE_ENV !== 'production') {
    const getMessage = (type: string) =>
      `Cannot change the ${type} of a Droppable during a drag`;
    invariant(isEqual(old.margin, fresh.margin), getMessage('margin'));
    invariant(isEqual(old.border, fresh.border), getMessage('border'));
    invariant(isEqual(old.padding, fresh.padding), getMessage('padding'));
  }
};

const getClosestScrollable = (droppable: DroppableDimension): Scrollable => {
  const scrollable: ?Scrollable = droppable.viewport.closestScrollable;
  invariant(
    scrollable,
    'Droppable must be a scroll container to allow dynamic changes',
  );
  return scrollable;
};

type Args = {|
  droppables: DroppableDimensionMap,
  modified: DroppableDimension[],
  initialWindowScroll: Position,
|};

export default ({
  droppables,
  modified,
  initialWindowScroll,
}: Args): DroppableDimensionMap => {
  // dynamically adjusting the client subject and page subject
  // of a droppable in response to dynamic additions and removals

  // No existing droppables modified
  if (!modified.length) {
    return droppables;
  }

  const changed: DroppableDimension[] = modified.map(
    (provided: DroppableDimension): DroppableDimension => {
      const existing: ?DroppableDimension = droppables[provided.descriptor.id];
      invariant(existing, 'Could not locate droppable in existing droppables');
      const oldClient: BoxModel = existing.client;
      const newClient: BoxModel = provided.client;
      const oldScrollable: Scrollable = getClosestScrollable(existing);
      const newScrollable: Scrollable = getClosestScrollable(provided);
      // Extra checks to help with development
      if (process.env.NODE_ENV !== 'production') {
        throwIfSpacingChange(existing.client, provided.client);
        throwIfSpacingChange(
          oldScrollable.frameClient,
          newScrollable.frameClient,
        );

        const isFrameEqual: boolean =
          oldScrollable.frameClient.marginBox.height ===
            newScrollable.frameClient.marginBox.height &&
          oldScrollable.frameClient.marginBox.width ===
            newScrollable.frameClient.marginBox.width;

        if (!isFrameEqual) {
          console.error(
            'frame has changed',
            'old',
            oldScrollable.frameClient.borderBox.height,
            'new',
            newScrollable.frameClient.borderBox.height,
          );
        }
      }

      const client: BoxModel = createBox({
        borderBox: expandBorderBox(oldClient.borderBox, newClient.borderBox),
        margin: provided.client.margin,
        border: provided.client.border,
        padding: provided.client.padding,
      });

      // TODO: should the frameClient be changing at all!?
      const frameClient: BoxModel = createBox({
        borderBox: expandBorderBox(
          oldScrollable.frameClient.borderBox,
          newScrollable.frameClient.borderBox,
        ),
        margin: newScrollable.frameClient.margin,
        border: newScrollable.frameClient.border,
        padding: newScrollable.frameClient.padding,
      });

      const closest: Closest = {
        client: frameClient,
        page: withScroll(frameClient, initialWindowScroll),
        scrollSize: newScrollable.scrollSize,
        scroll: oldScrollable.scroll.initial,
        shouldClipSubject: oldScrollable.shouldClipSubject,
      };

      const withSizeChanged: DroppableDimension = getDroppableDimension({
        descriptor: provided.descriptor,
        isEnabled: provided.isEnabled,
        direction: provided.axis.direction,
        client,
        page: withScroll(client, initialWindowScroll),
        closest,
      });

      const scrolled: DroppableDimension = scrollDroppable(
        withSizeChanged,
        // TODO: scroll changes due to insertions..>?
        newScrollable.scroll.initial,
      );

      return scrolled;
    },
  );

  const result: DroppableDimensionMap = {
    ...droppables,
    ...toDroppableMap(changed),
  };

  return result;
};
