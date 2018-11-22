// @flow
describe('cancel', () => {
  it('should cancel any pending window scroll', () => {
    const thresholds: PixelThresholds = getPixelThresholds(
      scrollableViewport.frame,
      axis,
    );
    const onMaxBoundary: Position = patch(
      axis.line,
      scrollableViewport.frame[axis.size] - thresholds.maxSpeedAt,
      scrollableViewport.frame.center[axis.crossAxisLine],
    );

    fluidScroll(
      dragTo({
        selection: onMaxBoundary,
        viewport: scrollableViewport,
      }),
    );

    // frame not cleared
    expect(mocks.scrollWindow).not.toHaveBeenCalled();

    fluidScroll.cancel();
    requestAnimationFrame.flush();

    expect(mocks.scrollWindow).not.toHaveBeenCalled();
  });

  it('should cancel any pending droppable scroll', () => {
    const thresholds: PixelThresholds = getPixelThresholds(
      frameClient.borderBox,
      axis,
    );
    const onMaxBoundary: Position = patch(
      axis.line,
      frameClient.borderBox[axis.size] - thresholds.maxSpeedAt,
      frameClient.borderBox.center[axis.crossAxisLine],
    );
    const drag: DraggingState = addDroppable(
      dragTo({
        selection: onMaxBoundary,
        viewport: scrollableViewport,
      }),
      scrollable,
    );

    fluidScroll(drag);

    // frame not cleared
    expect(mocks.scrollDroppable).not.toHaveBeenCalled();

    // should cancel the next frame
    fluidScroll.cancel();
    requestAnimationFrame.flush();

    expect(mocks.scrollDroppable).not.toHaveBeenCalled();
  });
});
