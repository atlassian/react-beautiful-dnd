// @flow
import invariant from 'tiny-invariant';
import {
  type BoxModel,
  type Position,
  createBox,
  getRect,
} from 'css-box-model';
import type {
  ScrollSize,
  DroppableDimension,
  DroppableDescriptor,
  Scrollable,
  ScrollDetails,
} from '../../../../src/types';
import getDroppable from '../../../../src/state/droppable/get-droppable';
import scrollDroppable from '../../../../src/state/droppable/scroll-droppable';
import { negate } from '../../../../src/state/position';
import getMaxScroll from '../../../../src/state/get-max-scroll';

const descriptor: DroppableDescriptor = {
  id: 'drop-1',
  type: 'TYPE',
};

it('should update the frame scroll and the subject', () => {
  const scrollSize: ScrollSize = {
    scrollHeight: 500,
    scrollWidth: 100,
  };
  const customClient: BoxModel = createBox({
    borderBox: {
      // 500 px high
      top: 0,
      left: 0,
      bottom: scrollSize.scrollHeight,
      right: scrollSize.scrollWidth,
    },
  });
  const customPage: BoxModel = customClient;
  const frameClient: BoxModel = createBox({
    borderBox: {
      // only viewing top 100px
      bottom: 100,
      // unchanged
      top: 0,
      right: scrollSize.scrollWidth,
      left: 0,
    },
  });
  const framePage: BoxModel = frameClient;
  const originalFrameScroll: Position = { x: 0, y: 0 };
  const droppable: DroppableDimension = getDroppable({
    descriptor,
    client: customClient,
    page: customPage,
    direction: 'vertical',
    isEnabled: true,
    isCombineEnabled: false,
    isFixedOnPage: false,
    closest: {
      client: frameClient,
      page: framePage,
      scrollSize,
      scroll: originalFrameScroll,
      shouldClipSubject: true,
    },
  });

  const originalFrame: ?Scrollable = droppable.frame;
  invariant(originalFrame);
  // original frame
  expect(originalFrame.pageMarginBox).toEqual(framePage.marginBox);
  // subject is currently clipped by the frame
  expect(droppable.subject.active).toEqual(framePage.marginBox);

  // scrolling down
  const newScroll: Position = { x: 0, y: 100 };
  const updated: DroppableDimension = scrollDroppable(droppable, newScroll);
  const updatedFrame: ?Scrollable = updated.frame;
  invariant(updatedFrame);

  // unchanged frame client
  expect(updatedFrame.frameClient).toEqual(originalFrame.frameClient);
  expect(updatedFrame.pageMarginBox).toEqual(framePage.marginBox);

  // updated scroll info
  {
    const expected: ScrollDetails = {
      initial: originalFrameScroll,
      current: newScroll,
      diff: {
        value: newScroll,
        displacement: negate(newScroll),
      },
      max: getMaxScroll({
        scrollWidth: scrollSize.scrollWidth,
        scrollHeight: scrollSize.scrollHeight,
        width: frameClient.paddingBox.width,
        height: frameClient.paddingBox.height,
      }),
    };
    expect(updatedFrame.scroll).toEqual(expected);
  }

  // updated clipped
  // can now see the bottom half of the subject
  expect(updated.subject.active).toEqual(
    getRect({
      top: 0,
      bottom: 100,
      // unchanged
      right: 100,
      left: 0,
    }),
  );
});

it('should allow scrolling beyond the max position', () => {
  const customClient: BoxModel = createBox({
    borderBox: {
      top: 0,
      left: 0,
      right: 200,
      bottom: 200,
    },
  });
  const frameClient: BoxModel = createBox({
    borderBox: {
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
    },
  });
  // this is to allow for scrolling into a foreign placeholder
  const scrollable: DroppableDimension = getDroppable({
    descriptor,
    client: customClient,
    page: customClient,
    isEnabled: true,
    direction: 'vertical',
    isCombineEnabled: false,
    isFixedOnPage: false,
    closest: {
      client: frameClient,
      page: frameClient,
      scrollSize: {
        scrollWidth: 200,
        scrollHeight: 200,
      },
      scroll: { x: 0, y: 0 },
      shouldClipSubject: true,
    },
  });
  const originalFrame: ?Scrollable = scrollable.frame;
  invariant(originalFrame);

  const scrolled: DroppableDimension = scrollDroppable(scrollable, {
    x: 300,
    y: 300,
  });

  // current is larger than max
  const updatedFrame: ?Scrollable = scrolled.frame;
  invariant(updatedFrame);
  expect(updatedFrame.scroll.current).toEqual({
    x: 300,
    y: 300,
  });
  // current max is unchanged
  expect(updatedFrame.scroll.max).toEqual(originalFrame.scroll.max);
});
