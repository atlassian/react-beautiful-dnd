// @flow
import canStartDrag from '../../../src/state/can-start-drag';
import * as state from '../../utils/simple-state-preset';
import type { State } from '../../../src/types';

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

  describe('no unhandled phases', () => {
    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
      console.warn.mockRestore();
    });

    it('should log a warning if there is an unhandled phase', () => {
      // this is usually guarded against through the type system
      // however we want to assert that the console.warn is not called
      // (this is needed the validate the next test)
      const fake: State = ({
        ...state.idle,
        phase: 'SOME_MADE_UP_PHASE',
      } : any);
      expect(canStartDrag(fake)).toBe(false);
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle every phase', () => {
      state.allPhases().forEach((current: State) => {
        canStartDrag(current);
        expect(console.warn).not.toHaveBeenCalled();
      });
    });
  });
});
