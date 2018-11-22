// @flow
describe('window scrolling', () => {
  const thresholds: PixelThresholds = getPixelThresholds(
    scrollableViewport.frame,
    axis,
  );
  const crossAxisThresholds: PixelThresholds = getPixelThresholds(
    scrollableViewport.frame,
    axis === vertical ? horizontal : vertical,
  );

  describe('moving forward to end of window', () => {
    const onStartBoundary: Position = patch(
      axis.line,
      // to the boundary is not enough to start
      scrollableViewport.frame[axis.size] - thresholds.startFrom,
      scrollableViewport.frame.center[axis.crossAxisLine],
    );
    const onMaxBoundary: Position = patch(
      axis.line,
      scrollableViewport.frame[axis.size] - thresholds.maxSpeedAt,
      scrollableViewport.frame.center[axis.crossAxisLine],
    );

    it('should not scroll if not past the start threshold', () => {
      fluidScroll(
        dragTo({
          selection: onStartBoundary,
          viewport: scrollableViewport,
        }),
      );

      requestAnimationFrame.flush();
      expect(mocks.scrollWindow).not.toHaveBeenCalled();
    });

    it('should scroll if moving beyond the start threshold', () => {
      const target: Position = add(onStartBoundary, patch(axis.line, 1));

      fluidScroll(
        dragTo({
          selection: target,
          viewport: scrollableViewport,
        }),
      );

      expect(mocks.scrollWindow).not.toHaveBeenCalled();

      // only called after a frame
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalled();
      // moving forwards
      const request: Position = mocks.scrollWindow.mock.calls[0][0];
      expect(request[axis.line]).toBeGreaterThan(0);
    });

    it('should throttle multiple scrolls into a single animation frame', () => {
      const target1: Position = add(onStartBoundary, patch(axis.line, 1));
      const target2: Position = add(onStartBoundary, patch(axis.line, 3));

      fluidScroll(
        dragTo({
          selection: target1,
          viewport: scrollableViewport,
        }),
      );
      fluidScroll(
        dragTo({
          selection: target2,
          viewport: scrollableViewport,
        }),
      );

      expect(mocks.scrollWindow).not.toHaveBeenCalled();

      // only called after a frame
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalledTimes(1);

      // verification
      requestAnimationFrame.flush();
      expect(mocks.scrollWindow).toHaveBeenCalledTimes(1);

      // not testing value called as we are not exposing getRequired scroll
    });

    it('should get faster the closer to the max speed point', () => {
      const target1: Position = add(onStartBoundary, patch(axis.line, 1));
      const target2: Position = add(onStartBoundary, patch(axis.line, 2));

      fluidScroll(
        dragTo({
          selection: target1,
          viewport: scrollableViewport,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalledTimes(1);
      const scroll1: Position = (mocks.scrollWindow.mock.calls[0][0]: any);

      fluidScroll(
        dragTo({
          selection: target2,
          viewport: scrollableViewport,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalledTimes(2);
      const scroll2: Position = (mocks.scrollWindow.mock.calls[1][0]: any);

      expect(scroll1[axis.line]).toBeLessThan(scroll2[axis.line]);

      // validation
      expect(scroll1[axis.crossAxisLine]).toBe(0);
      expect(scroll2[axis.crossAxisLine]).toBe(0);
    });

    it('should have the top speed at the max speed point', () => {
      const expected: Position = patch(axis.line, config.maxScrollSpeed);

      fluidScroll(
        dragTo({
          selection: onMaxBoundary,
          viewport: scrollableViewport,
        }),
      );
      requestAnimationFrame.step();

      expect(mocks.scrollWindow).toHaveBeenCalledWith(expected);
    });

    it('should have the top speed when moving beyond the max speed point', () => {
      const target: Position = add(onMaxBoundary, patch(axis.line, 1));
      const expected: Position = patch(axis.line, config.maxScrollSpeed);

      fluidScroll(
        dragTo({
          selection: target,
          viewport: scrollableViewport,
        }),
      );
      requestAnimationFrame.step();

      expect(mocks.scrollWindow).toHaveBeenCalledWith(expected);
    });

    it('should not scroll if the item is too big', () => {
      const expanded: Spacing = expandByPosition(scrollableViewport.frame, {
        x: 1,
        y: 1,
      });
      const tooBig: DraggableDimension = getDraggableDimension({
        descriptor: preset.inHome1.descriptor,
        borderBox: expanded,
      });
      const selection: Position = onMaxBoundary;
      const custom: DraggingState = addDraggable(
        state.dragging(
          preset.inHome1.descriptor.id,
          selection,
          scrollableViewport,
        ),
        tooBig,
      );

      fluidScroll(custom);

      requestAnimationFrame.flush();
      expect(mocks.scrollWindow).not.toHaveBeenCalled();
    });

    it('should not scroll if the window cannot scroll', () => {
      const target: Position = onMaxBoundary;

      fluidScroll(
        dragTo({
          selection: target,
          viewport: unscrollableViewport,
        }),
      );

      requestAnimationFrame.step();
      expect(mocks.scrollWindow).not.toHaveBeenCalled();
    });
  });

  describe('moving backwards towards the start of window', () => {
    const windowScroll: Position = patch(axis.line, 10);
    const scrolledViewport: Viewport = scrollViewport(
      scrollableViewport,
      windowScroll,
    );

    const onStartBoundary: Position = patch(
      axis.line,
      // at the boundary is not enough to start
      windowScroll[axis.line] + thresholds.startFrom,
      scrolledViewport.frame.center[axis.crossAxisLine],
    );
    const onMaxBoundary: Position = patch(
      axis.line,
      windowScroll[axis.line] + thresholds.maxSpeedAt,
      scrolledViewport.frame.center[axis.crossAxisLine],
    );

    it('should not scroll if not past the start threshold', () => {
      fluidScroll(
        dragTo({
          selection: onStartBoundary,
          viewport: scrolledViewport,
        }),
      );

      requestAnimationFrame.flush();
      expect(mocks.scrollWindow).not.toHaveBeenCalled();
    });

    it('should scroll if moving beyond the start threshold', () => {
      const target: Position = subtract(onStartBoundary, patch(axis.line, 1));

      fluidScroll(
        dragTo({
          selection: target,
          viewport: scrolledViewport,
        }),
      );

      expect(mocks.scrollWindow).not.toHaveBeenCalled();

      // only called after a frame
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalled();
      // moving backwards
      const request: Position = mocks.scrollWindow.mock.calls[0][0];
      expect(request[axis.line]).toBeLessThan(0);
    });

    it('should throttle multiple scrolls into a single animation frame', () => {
      const target1: Position = subtract(onStartBoundary, patch(axis.line, 1));
      const target2: Position = subtract(onStartBoundary, patch(axis.line, 2));

      fluidScroll(
        dragTo({
          selection: target1,
          viewport: scrolledViewport,
        }),
      );
      fluidScroll(
        dragTo({
          selection: target2,
          viewport: scrolledViewport,
        }),
      );

      expect(mocks.scrollWindow).not.toHaveBeenCalled();

      // only called after a frame
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalledTimes(1);

      // verification
      requestAnimationFrame.flush();
      expect(mocks.scrollWindow).toHaveBeenCalledTimes(1);

      // not testing value called as we are not exposing getRequired scroll
    });

    it('should get faster the closer to the max speed point', () => {
      const target1: Position = subtract(onStartBoundary, patch(axis.line, 1));
      const target2: Position = subtract(onStartBoundary, patch(axis.line, 2));

      fluidScroll(
        dragTo({
          selection: target1,
          viewport: scrolledViewport,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalledTimes(1);
      const scroll1: Position = (mocks.scrollWindow.mock.calls[0][0]: any);

      fluidScroll(
        dragTo({
          selection: target2,
          viewport: scrolledViewport,
        }),
      );
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalledTimes(2);
      const scroll2: Position = (mocks.scrollWindow.mock.calls[1][0]: any);

      // moving backwards so a smaller value is bigger
      expect(scroll1[axis.line]).toBeGreaterThan(scroll2[axis.line]);
      // or put another way:
      expect(Math.abs(scroll1[axis.line])).toBeLessThan(
        Math.abs(scroll2[axis.line]),
      );

      // validation
      expect(scroll1[axis.crossAxisLine]).toBe(0);
      expect(scroll2[axis.crossAxisLine]).toBe(0);
    });

    it('should have the top speed at the max speed point', () => {
      const target: Position = onMaxBoundary;
      const expected: Position = patch(axis.line, -config.maxScrollSpeed);

      fluidScroll(
        dragTo({
          selection: target,
          viewport: scrolledViewport,
        }),
      );
      requestAnimationFrame.step();

      expect(mocks.scrollWindow).toHaveBeenCalledWith(expected);
    });

    it('should have the top speed when moving beyond the max speed point', () => {
      const target: Position = subtract(onMaxBoundary, patch(axis.line, 1));
      const expected: Position = patch(axis.line, -config.maxScrollSpeed);

      fluidScroll(
        dragTo({
          selection: target,
          viewport: scrolledViewport,
        }),
      );
      requestAnimationFrame.step();

      expect(mocks.scrollWindow).toHaveBeenCalledWith(expected);
    });

    it('should not scroll if the item is too big', () => {
      const expanded: Spacing = expandByPosition(scrollableViewport.frame, {
        x: 1,
        y: 1,
      });
      const tooBig: DraggableDimension = getDraggableDimension({
        descriptor: preset.inHome1.descriptor,
        borderBox: expanded,
      });
      const selection: Position = onMaxBoundary;
      const custom: DraggingState = addDraggable(
        state.dragging(
          preset.inHome1.descriptor.id,
          selection,
          scrollableViewport,
        ),
        tooBig,
      );

      fluidScroll(custom);

      requestAnimationFrame.flush();
      expect(mocks.scrollWindow).not.toHaveBeenCalled();
    });

    it('should not scroll if the window cannot scroll', () => {
      const target: Position = onMaxBoundary;

      fluidScroll(
        dragTo({
          selection: target,
          viewport: unscrollableViewport,
        }),
      );

      requestAnimationFrame.step();
      expect(mocks.scrollWindow).not.toHaveBeenCalled();
    });
  });

  // just some light tests to ensure that cross axis moving also works
  describe('moving forward on the cross axis', () => {
    const onStartBoundary: Position = patch(
      axis.line,
      scrollableViewport.frame.center[axis.line],
      // to the boundary is not enough to start
      scrollableViewport.frame[axis.crossAxisSize] -
        crossAxisThresholds.startFrom,
    );

    it('should not scroll if not past the start threshold', () => {
      fluidScroll(
        dragTo({
          selection: onStartBoundary,
          viewport: scrollableViewport,
        }),
      );

      requestAnimationFrame.flush();
      expect(mocks.scrollWindow).not.toHaveBeenCalled();
    });

    it('should scroll if moving beyond the start threshold', () => {
      const target: Position = add(
        onStartBoundary,
        patch(axis.crossAxisLine, 1),
      );

      fluidScroll(
        dragTo({
          selection: target,
          viewport: scrollableViewport,
        }),
      );

      expect(mocks.scrollWindow).not.toHaveBeenCalled();

      // only called after a frame
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalled();
      // moving forwards
      const request: Position = mocks.scrollWindow.mock.calls[0][0];
      expect(request[axis.crossAxisLine]).toBeGreaterThan(0);
    });
  });

  // just some light tests to ensure that cross axis moving also works
  describe('moving backward on the cross axis', () => {
    const windowScroll: Position = patch(axis.crossAxisLine, 10);
    const scrolled: Viewport = scrollViewport(scrollableViewport, windowScroll);

    const onStartBoundary: Position = patch(
      axis.line,
      scrolled.frame.center[axis.line],
      // to the boundary is not enough to start
      windowScroll[axis.crossAxisLine] + crossAxisThresholds.startFrom,
    );

    it('should not scroll if not past the start threshold', () => {
      fluidScroll(
        dragTo({
          selection: onStartBoundary,
          viewport: scrolled,
        }),
      );

      requestAnimationFrame.flush();
      expect(mocks.scrollWindow).not.toHaveBeenCalled();
    });

    it('should scroll if moving beyond the start threshold', () => {
      const target: Position = subtract(
        onStartBoundary,
        patch(axis.crossAxisLine, 1),
      );

      fluidScroll(
        dragTo({
          selection: target,
          viewport: scrolled,
        }),
      );

      expect(mocks.scrollWindow).not.toHaveBeenCalled();

      // only called after a frame
      requestAnimationFrame.step();
      expect(mocks.scrollWindow).toHaveBeenCalled();
      // moving backwards
      const request: Position = mocks.scrollWindow.mock.calls[0][0];
      expect(request[axis.crossAxisLine]).toBeLessThan(0);
    });
  });

  describe('big draggable', () => {
    const onMaxBoundaryOfBoth: Position = patch(
      axis.line,
      scrollableViewport.frame[axis.size] - thresholds.maxSpeedAt,
      scrollableViewport.frame[axis.crossAxisSize] -
        crossAxisThresholds.maxSpeedAt,
    );

    describe('bigger on the main axis', () => {
      it('should not allow scrolling on the main axis, but allow scrolling on the cross axis', () => {
        const expanded: Spacing = expandByPosition(
          scrollableViewport.frame,
          patch(axis.line, 1),
        );
        const tooBigOnMainAxis: DraggableDimension = getDraggableDimension({
          descriptor: preset.inHome1.descriptor,
          borderBox: expanded,
        });

        const selection: Position = onMaxBoundaryOfBoth;
        const custom: DraggingState = addDraggable(
          state.dragging(
            preset.inHome1.descriptor.id,
            selection,
            scrollableViewport,
          ),
          tooBigOnMainAxis,
        );

        fluidScroll(custom);

        requestAnimationFrame.step();
        expect(mocks.scrollWindow).toHaveBeenCalledWith(
          // scroll ocurred on the cross axis, but not on the main axis
          patch(axis.crossAxisLine, config.maxScrollSpeed),
        );
      });
    });

    describe('bigger on the cross axis', () => {
      it('should not allow scrolling on the cross axis, but allow scrolling on the main axis', () => {
        const expanded: Spacing = expandByPosition(
          scrollableViewport.frame,
          patch(axis.crossAxisLine, 1),
        );
        const tooBigOnCrossAxis: DraggableDimension = getDraggableDimension({
          descriptor: preset.inHome1.descriptor,
          borderBox: expanded,
        });

        const selection: Position = onMaxBoundaryOfBoth;
        const custom: DraggingState = addDraggable(
          state.dragging(
            preset.inHome1.descriptor.id,
            selection,
            scrollableViewport,
          ),
          tooBigOnCrossAxis,
        );

        fluidScroll(custom);

        requestAnimationFrame.step();
        expect(mocks.scrollWindow).toHaveBeenCalledWith(
          // scroll ocurred on the main axis, but not on the cross axis
          patch(axis.line, config.maxScrollSpeed),
        );
      });
    });

    describe('bigger on both axis', () => {
      it('should not allow scrolling on any axis', () => {
        const expanded: Spacing = expandByPosition(
          scrollableViewport.frame,
          patch(axis.line, 1, 1),
        );
        const tooBig: DraggableDimension = getDraggableDimension({
          descriptor: preset.inHome1.descriptor,
          borderBox: expanded,
        });

        const selection: Position = onMaxBoundaryOfBoth;
        const custom: DraggingState = addDraggable(
          state.dragging(
            preset.inHome1.descriptor.id,
            selection,
            scrollableViewport,
          ),
          tooBig,
        );

        fluidScroll(custom);

        requestAnimationFrame.step();
        expect(mocks.scrollWindow).not.toHaveBeenCalled();
      });
    });
  });
});
