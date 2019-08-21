// @flow
import { type BoxModel, type Position } from 'css-box-model';
import type {
  Axis,
  DroppableDimension,
  DroppableDescriptor,
  Scrollable,
  DroppableSubject,
  ScrollSize,
} from '../../types';
import { vertical, horizontal } from '../axis';
import { origin } from '../position';
import getMaxScroll from '../get-max-scroll';
import getSubject from './util/get-subject';

export type Closest = {|
  client: BoxModel,
  page: BoxModel,
  scroll: Position,
  scrollSize: ScrollSize,
  shouldClipSubject: boolean,
|};

type Args = {|
  descriptor: DroppableDescriptor,
  isEnabled: boolean,
  isCombineEnabled: boolean,
  isCombineOnly: boolean,
  isFixedOnPage: boolean,
  direction: 'vertical' | 'horizontal',
  client: BoxModel,
  // is null when in a fixed container
  page: BoxModel,
  closest?: ?Closest,
|};

export default ({
  descriptor,
  isEnabled,
  isCombineEnabled,
  isCombineOnly,
  isFixedOnPage,
  direction,
  client,
  page,
  closest,
}: Args): DroppableDimension => {
  const frame: ?Scrollable = (() => {
    if (!closest) {
      return null;
    }

    const { scrollSize, client: frameClient } = closest;

    // scrollHeight and scrollWidth are based on the padding box
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight
    const maxScroll: Position = getMaxScroll({
      scrollHeight: scrollSize.scrollHeight,
      scrollWidth: scrollSize.scrollWidth,
      height: frameClient.paddingBox.height,
      width: frameClient.paddingBox.width,
    });

    return {
      pageMarginBox: closest.page.marginBox,
      frameClient,
      scrollSize,
      shouldClipSubject: closest.shouldClipSubject,
      scroll: {
        initial: closest.scroll,
        current: closest.scroll,
        max: maxScroll,
        diff: {
          value: origin,
          displacement: origin,
        },
      },
    };
  })();

  const axis: Axis = direction === 'vertical' ? vertical : horizontal;

  const subject: DroppableSubject = getSubject({
    page,
    withPlaceholder: null,
    axis,
    frame,
  });

  const dimension: DroppableDimension = {
    descriptor,
    isCombineEnabled,
    isCombineOnly,
    isFixedOnPage,
    axis,
    isEnabled,
    client,
    page,
    frame,
    subject,
  };

  return dimension;
};
