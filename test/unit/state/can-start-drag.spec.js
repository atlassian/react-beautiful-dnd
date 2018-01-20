// @flow
import canStartDrag from '../../../src/state/can-start-drag';
import * as state from '../../utils/simple-state-preset';
import { getPreset } from '../../utils/dimension';
import type { State } from '../../../src/types';
import * as logger from '../../../src/log';

jest.mock('../../../src/log');

const preset = getPreset();

describe('can start drag', () => {
  describe('at rest', () => {
    it('should allow lifting if in IDLE phase', () => {
      expect(canStartDrag(state.idle, preset.inHome1.descriptor.id)).toBe(true);
    });

    it('should allow lifting if in DROP_COMPLETE phase', () => {
      expect(canStartDrag(state.dropComplete(), preset.inHome1.descriptor.id)).toBe(true);
    });
  });

  describe('while dragging', () => {
    it('should not allow lifting in the PREPARING phase', () => {
      expect(canStartDrag(state.preparing, preset.inHome1.descriptor.id)).toBe(false);
    });

    it('should not allow lifting in the COLLECTING_INITIAL_DIMENSIONS phase', () => {
      expect(canStartDrag(state.requesting(), preset.inHome1.descriptor.id)).toBe(false);
    });

    it('should not allow lifting in the DRAGGING phase', () => {
      expect(canStartDrag(state.dragging(), preset.inHome1.descriptor.id)).toBe(false);
    });
  });

  describe('while animating drop', () => {
    it('should allow lifting if dropping another item', () => {
      expect(canStartDrag(
        state.dropAnimating(preset.inHome1.descriptor.id),
        preset.inHome2.descriptor.id)
      ).toBe(true);
    });

    it('should disallow lifting if dropping the same item', () => {
      expect(canStartDrag(
        state.dropAnimating(preset.inHome1.descriptor.id),
        preset.inHome1.descriptor.id)
      ).toBe(false);
    });

    it('should disallow lifting while animating user cancel', () => {
      expect(canStartDrag(
        state.userCancel(preset.inHome1.descriptor.id),
        preset.inHome1.descriptor.id),
      ).toBe(false);
    });
  });

  describe('no unhandled phases', () => {
    it('should log a warning if there is an unhandled phase', () => {
      // this is usually guarded against through the type system
      // however we want to assert that the logger.warn is not called
      // (this is needed the validate the next test)
      const fake: State = ({
        ...state.idle,
        phase: 'SOME_MADE_UP_PHASE',
      } : any);
      expect(canStartDrag(fake, preset.inHome1.descriptor.id)).toBe(false);
      expect(logger.warn).toHaveBeenCalled();
    });
    
    it('should handle every phase', () => {
      //jest.resetAllMocks();
      state.allPhases().forEach((current: State) => {
        canStartDrag(current, preset.inHome1.descriptor.id);
        expect(logger.warn).not.toHaveBeenCalled();
      });
    });
  });
});
