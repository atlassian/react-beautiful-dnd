// @flow
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../utils/dimension';
import getStatePreset from '../../../utils/get-simple-state-preset';
import getOwnProps from './get-own-props';
import type {
  Selector,
  OwnProps,
  MapProps,
} from '../../../../src/view/draggable/draggable-types';
import type { DropAnimatingState } from '../../../../src/types';

const preset = getPreset();
const state = getStatePreset();
const ownProps: OwnProps = getOwnProps(preset.inHome1);

describe('dropping', () => {
  it('should move to the new home offset', () => {
    const current: DropAnimatingState = state.dropAnimating();
    const selector: Selector = makeMapStateToProps();
    const expected: MapProps = {
      isDragging: false,
      isDropAnimating: true,
      // moving to the new home offset
      offset: current.pending.newHomeOffset,
      shouldAnimateDisplacement: false,
      // not animating a drag - we are animating a drop
      shouldAnimateDragMovement: false,
      dimension: preset.inHome1,
      draggingOver: preset.home.descriptor.id,
    };

    const whileDropping: MapProps = selector(current, ownProps);

    expect(whileDropping).toEqual(expected);
  });
});
