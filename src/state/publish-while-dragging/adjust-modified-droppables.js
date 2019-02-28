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
import getDroppableDimension, {
  type Closest,
} from '../droppable/get-droppable';
import type {
  DroppableDimension,
  DroppableDimensionMap,
  Scrollable,
  Axis,
} from '../../types';
import { isEqual } from '../spacing';
import scrollDroppable from '../droppable/scroll-droppable';
import { removePlaceholder } from '../droppable/with-placeholder';
import getFrame from '../get-frame';

const throwIfSpacingChange = (old: BoxModel, fresh: BoxModel) => {
  if (process.env.NODE_ENV !== 'production') {
    const getMessage = (spacingType: string) =>
      `Cannot change the ${spacingType} of a Droppable during a drag`;
    invariant(isEqual(old.margin, fresh.margin), getMessage('margin'));
    invariant(isEqual(old.border, fresh.border), getMessage('border'));
    invariant(isEqual(old.padding, fresh.padding), getMessage('padding'));
  }
};

const adjustBorderBoxSize = (axis: Axis, old: Rect, fresh: Rect): Spacing => ({
  // top and left positions cannot change
  top: old.top,
  left: old.left,
  // this is the main logic of this function - the size adjustment
  right: old.left + fresh.width,
  bottom: old.top + fresh.height,
});

type Args = {|
  modified: DroppableDimension[],
  existingDroppables: DroppableDimensionMap,
  initialWindowScroll: Position,
|};

export default ({
  modified,
  existingDroppables,
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
      const raw: ?DroppableDimension =
        existingDroppables[provided.descriptor.id];
      invariant(raw, 'Could not locate droppable in existing droppables');

      const existing: DroppableDimension = raw.subject.withPlaceholder
        ? removePlaceholder(raw)
        : raw;

      const oldClient: BoxModel = existing.client;
      const newClient: BoxModel = provided.client;
      const oldScrollable: Scrollable = getFrame(existing);
      const newScrollable: Scrollable = getFrame(provided);

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
          existing.axis,
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
        isCombineEnabled: provided.isCombineEnabled,
        isSortDisabled: provided.isSortDisabled,
        isFixedOnPage: provided.isFixedOnPage,
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
