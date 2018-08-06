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

const adjustBorderBoxSize = (old: Rect, fresh: Rect): Spacing => ({
  // top and left positions cannot change
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
  modified: DroppableDimension[],
  existing: DroppableDimensionMap,
  initialWindowScroll: Position,
|};

export default ({
  modified,
  existing: existingDroppables,
  initialWindowScroll,
}: Args): DroppableDimension[] => {
  // dynamically adjusting the client subject and page subject
  // of a droppable in response to dynamic additions and removals

  // No existing droppables modified
  if (!modified.length) {
    return modified;
  }

  const adjusted: DroppableDimension[] = modified.map(
    (provided: DroppableDimension): DroppableDimension => {
      const existing: ?DroppableDimension =
        existingDroppables[provided.descriptor.id];
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
          oldScrollable.frameClient.borderBox.height ===
            newScrollable.frameClient.borderBox.height &&
          oldScrollable.frameClient.borderBox.width ===
            newScrollable.frameClient.borderBox.width;

        invariant(
          isFrameEqual,
          'The width and height of your Droppable scroll container cannot change when adding or removing Draggables during a drag',
        );
      }

      const client: BoxModel = createBox({
        borderBox: adjustBorderBoxSize(
          oldClient.borderBox,
          newClient.borderBox,
        ),
        margin: oldClient.margin,
        border: oldClient.border,
        padding: oldClient.padding,
      });

      const closest: Closest = {
        // not allowing a change to the scrollable frame size during a drag
        client: oldScrollable.frameClient,
        page: withScroll(oldScrollable.frameClient, initialWindowScroll),
        shouldClipSubject: oldScrollable.shouldClipSubject,
        // the scroll size can change during a drag
        scrollSize: newScrollable.scrollSize,
        // using the initial scroll point
        scroll: oldScrollable.scroll.initial,
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
        // TODO: use .initial - i guess both work though..
        newScrollable.scroll.current,
      );

      return scrolled;
    },
  );

  return adjusted;
};
