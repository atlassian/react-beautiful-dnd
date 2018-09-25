// @flow
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../utils/dimension';
import getStatePreset from '../../../utils/get-simple-state-preset';
import getOwnProps from './util/get-own-props';
import type {
  Selector,
  OwnProps,
  MapProps,
} from '../../../../src/view/draggable/draggable-types';
import type { DropAnimatingState } from '../../../../src/types';
import { curves } from '../../../../src/view/animation';

const preset = getPreset();
const state = getStatePreset();
const ownProps: OwnProps = getOwnProps(preset.inHome1);

describe('dropping', () => {
  it('should move to the new home offset', () => {
    const current: DropAnimatingState = state.dropAnimating();
    const selector: Selector = makeMapStateToProps();
    const expected: MapProps = {
      dragging: {
        dimension: preset.inHome1,
        draggingOver: preset.home.descriptor.id,
        forceShouldAnimate: null,
        offset: current.pending.newHomeOffset,
        mode: current.pending.result.mode,
        combineWith: null,
        dropping: {
          reason: 'DROP',
          duration: current.pending.dropDuration,
          curve: curves.drop,
          moveTo: current.pending.newHomeOffset,
        },
      },
      secondary: null,
    };

    const whileDropping: MapProps = selector(current, ownProps);

    expect(whileDropping).toEqual(expected);
  });
});
