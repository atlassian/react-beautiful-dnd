// @flow

describe('style marshal', () => {
  describe('not dragging', () => {
    it('should apply the base styles', () => {
      const marshal: StyleMarshal =
    });

    it('should not prevent pointer events or add a transition to the draggable', () => {

    });
  });

  describe('dragging', () => {
    it('should apply the base styles', () => {

    });

    it('should block pointer events on the draggables', () => {

    });

    it('should transition transforms on the draggables', () => {

    });

    it('should prevent selecting text', () => {

    });

    it('should apply a grabbing cursor to the body', () => {

    });
  });

  describe('dropping', () => {
    it('should remove the dragging styles if a drag is stopped', () => {

    });

    // This will remove pointer-events: none and let the user start dropping other items
    it('should remove the dragging styles if animating a drop', () => {

    });

    describe('animating cancel', () => {
      // we do not allow dragging of other items while animating a cancel
      it('should maintain the dragging styles if animating a cancel', () => {

      });

      it('should clear the dragging style when the animation is finished', () => {

      });

      it('should clear the dragging style when the cancel is flushed at the start of another drag', () => {

      });
    });
  });
});
