// @flow
import canStartDrag from '../../../src/state/can-start-drag';
import * as state from '../../utils/simple-state-preset';

describe('can start drag', () => {
  describe('at rest', () => {
    it('should allow lifting if in IDLE phase', () => {
      expect(canStartDrag(state.idle)).toBe(true);
    });

    it('should allow lifting if in DROP_COMPLETE phase', () => {
      expect(canStartDrag(state.dropComplete())).toBe(true);
    });
  });

  describe('while dragging', () => {
    it('should not allow lifting in the PREPARING phase', () => {
      expect(canStartDrag(state.preparing)).toBe(false);
    });

    it('should not allow lifting in the COLLECTING_INITIAL_DIMENSIONS phase', () => {
      expect(canStartDrag(state.requesting())).toBe(false);
    });

    it('should not allow lifting in the DRAGGING phase', () => {
      expect(canStartDrag(state.dragging())).toBe(false);
    });
  });

  describe('while animating drop', () => {
    it('should allow lifting if dropping', () => {
      expect(canStartDrag(state.dropAnimating())).toBe(true);
    });

    it('should disallow lifting while animating user cancel', () => {
      expect(canStartDrag(state.userCancel())).toBe(false);
    });
  });
});
