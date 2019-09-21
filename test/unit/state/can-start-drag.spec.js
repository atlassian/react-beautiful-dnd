// @flow
import canStartDrag from '../../../src/state/can-start-drag';
import getStatePreset from '../../util/get-simple-state-preset';
import { getPreset } from '../../util/dimension';

const preset = getPreset();
const state = getStatePreset();

describe('can start drag', () => {
  it('should allow lifting if in IDLE phase', () => {
    expect(canStartDrag(state.idle, preset.inHome1.descriptor.id)).toBe(true);
  });

  it('should not allow lifting in the COLLECTING phase', () => {
    expect(canStartDrag(state.collecting(), preset.inHome1.descriptor.id)).toBe(
      false,
    );
  });

  it('should not allow lifting in the DRAGGING phase', () => {
    expect(canStartDrag(state.dragging(), preset.inHome1.descriptor.id)).toBe(
      false,
    );
  });

  it('should not allow lifting in the DROP_PENDING phase', () => {
    expect(
      canStartDrag(state.dropPending(), preset.inHome1.descriptor.id),
    ).toBe(false);
  });

  describe('while animating drop', () => {
    it('should allow lifting if dropping another item', () => {
      expect(
        canStartDrag(
          state.dropAnimating(preset.inHome1.descriptor.id),
          preset.inHome2.descriptor.id,
        ),
      ).toBe(true);
    });

    it('should disallow lifting if dropping the same item', () => {
      expect(
        canStartDrag(
          state.dropAnimating(preset.inHome1.descriptor.id),
          preset.inHome1.descriptor.id,
        ),
      ).toBe(false);
    });

    it('should disallow lifting while animating user cancel', () => {
      expect(
        canStartDrag(
          state.userCancel(preset.inHome1.descriptor.id),
          preset.inHome1.descriptor.id,
        ),
      ).toBe(false);
    });
  });
});
