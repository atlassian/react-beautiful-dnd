// @flow
import {
  getBox,
  withScroll,
  createBox,
  type BoxModel,
  type Position,
  type Spacing,
} from 'css-box-model';
import {
  getDroppableDimension,
  type Closest,
} from '../../state/droppable-dimension';
import type { Env } from './get-env';
import type {
  DroppableDimension,
  DroppableDescriptor,
  Direction,
  ScrollSize,
} from '../../types';
import getScroll from './get-scroll';

const getClient = (
  targetRef: HTMLElement,
  closestScrollable: ?Element,
): BoxModel => {
  const base: BoxModel = getBox(targetRef);

  // Droppable has no scroll parent
  if (!closestScrollable) {
    return base;
  }

  // Droppable is not the same as the closest scrollable
  if (targetRef !== closestScrollable) {
    return base;
  }

  // Droppable is scrollable

  // Element.getBoundingClient() returns:
  // When not scrollable: the full size of the element
  // When scrollable: the visible size of the element
  // (which is not the full width of its scrollable content)
  // So we recalculate the borderBox of a scrollable droppable to give
  // it its full dimensions. This will be cut to the correct size by the frame

  // Creating the paddingBox based on scrollWidth / scrollTop
  // scrollWidth / scrollHeight are based on the paddingBox of an element
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight
  const top: number = base.paddingBox.top - closestScrollable.scrollTop;
  const left: number = base.paddingBox.left - closestScrollable.scrollLeft;
  const bottom: number = top + closestScrollable.scrollHeight;
  const right: number = left + closestScrollable.scrollWidth;

  const paddingBox: Spacing = {
    top,
    right,
    bottom,
    left,
  };

  // Creating the borderBox by adding the borders to the paddingBox
  const borderBox: Spacing = {
    top: paddingBox.top - base.border.top,
    right: paddingBox.right + base.border.right,
    bottom: paddingBox.bottom + base.border.bottom,
    left: paddingBox.left - base.border.left,
  };

  // We are not accounting for scrollbars
  // Adjusting for scrollbars is hard because:
  // - they are different between browsers
  // - scrollbars can be activated and removed during a drag
  // We instead account for this slightly in our auto scroller

  const client: BoxModel = createBox({
    borderBox,
    margin: base.margin,
    border: base.border,
    padding: base.padding,
  });
  return client;
};

type Args = {|
  ref: HTMLElement,
  descriptor: DroppableDescriptor,
  env: Env,
  windowScroll: Position,
  direction: Direction,
  isDropDisabled: boolean,
  isCombineEnabled: boolean,
  shouldClipSubject: boolean,
|};

export default ({
  ref,
  descriptor,
  env,
  windowScroll,
  direction,
  isDropDisabled,
  isCombineEnabled,
  shouldClipSubject,
}: Args): DroppableDimension => {
  const closestScrollable: ?Element = env.closestScrollable;
  const client: BoxModel = getClient(ref, closestScrollable);
  const page: BoxModel = withScroll(client, windowScroll);

  const closest: ?Closest = (() => {
    if (!closestScrollable) {
      return null;
    }

    const frameClient: BoxModel = getBox(closestScrollable);
    const scrollSize: ScrollSize = {
      scrollHeight: closestScrollable.scrollHeight,
      scrollWidth: closestScrollable.scrollWidth,
    };

    return {
      client: frameClient,
      page: withScroll(frameClient),
      scroll: getScroll(closestScrollable),
      scrollSize,
      shouldClipSubject,
    };
  })();

  const dimension: DroppableDimension = getDroppableDimension({
    descriptor,
    isEnabled: !isDropDisabled,
    isCombineEnabled,
    isFixedOnPage: env.isFixedOnPage,
    direction,
    client,
    page,
    closest,
  });

  return dimension;
};
