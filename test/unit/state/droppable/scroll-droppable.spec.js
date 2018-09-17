// @flow
it('should update the frame scroll and the clipping', () => {
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
  const droppable: DroppableDimension = getDroppableDimension({
    descriptor,
    client: customClient,
    page: customPage,
    direction: 'vertical',
    isEnabled: true,
    closest: {
      client: frameClient,
      page: framePage,
      scrollSize,
      scroll: originalFrameScroll,
      shouldClipSubject: true,
    },
  });

  const closestScrollable: Scrollable = getClosestScrollable(droppable);

  // original frame
  expect(closestScrollable.framePageMarginBox).toEqual(framePage.marginBox);
  // subject is currently clipped by the frame
  expect(droppable.viewport.clippedPageMarginBox).toEqual(framePage.marginBox);

  // scrolling down
  const newScroll: Position = { x: 0, y: 100 };
  const updated: DroppableDimension = scrollDroppable(droppable, newScroll);
  const updatedClosest: Scrollable = getClosestScrollable(updated);

  // unchanged frame client
  expect(updatedClosest.framePageMarginBox).toEqual(framePage.marginBox);

  // updated scroll info
  expect(updatedClosest.scroll).toEqual({
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
  });

  // updated clipped
  // can now see the bottom half of the subject
  expect(updated.viewport.clippedPageMarginBox).toEqual(
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
  const scrollable: DroppableDimension = getDroppableDimension({
    descriptor,
    client: customClient,
    page: customClient,
    isEnabled: true,
    direction: 'vertical',
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

  const scrolled: DroppableDimension = scrollDroppable(scrollable, {
    x: 300,
    y: 300,
  });

  // current is larger than max
  expect(getClosestScrollable(scrolled).scroll.current).toEqual({
    x: 300,
    y: 300,
  });
  // current max is unchanged
  expect(getClosestScrollable(scrolled).scroll.max).toEqual({
    x: 100,
    y: 100,
  });
  // original max
  expect(getClosestScrollable(scrollable).scroll.max).toEqual({
    x: 100,
    y: 100,
  });
});
