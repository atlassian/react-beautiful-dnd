// @flow
describe('window scrolling before droppable scrolling', () => {
  const custom: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: 'scrollable that is similiar to the viewport',
      type: 'TYPE',
    },
    borderBox: {
      top: 0,
      left: 0,
      // bigger than the frame
      right: windowScrollSize.scrollWidth,
      bottom: windowScrollSize.scrollHeight,
    },
    closest: {
      borderBox: scrollableViewport.frame,
      scrollSize: {
        scrollWidth: windowScrollSize.scrollWidth,
        scrollHeight: windowScrollSize.scrollHeight,
      },
      scroll: origin,
      shouldClipSubject: true,
    },
  });
  const thresholds: PixelThresholds = getPixelThresholds(
    scrollableViewport.frame,
    axis,
  );

  it('should scroll the window only if both the window and droppable can be scrolled', () => {
    const onMaxBoundary: Position = patch(
      axis.line,
      scrollableViewport.frame[axis.size] - thresholds.maxSpeedAt,
      scrollableViewport.frame.center[axis.crossAxisLine],
    );

    fluidScroll(
      addDroppable(
        dragTo({
          selection: onMaxBoundary,
          viewport: scrollableViewport,
        }),
        custom,
      ),
    );
    requestAnimationFrame.step();

    expect(mocks.scrollWindow).toHaveBeenCalled();
    expect(mocks.scrollDroppable).not.toHaveBeenCalled();
  });
});
