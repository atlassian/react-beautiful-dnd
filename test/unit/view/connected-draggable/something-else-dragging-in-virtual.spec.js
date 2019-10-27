// @flow
import type { Position } from 'css-box-model';
import type {
  Selector,
  OwnProps,
  MapProps,
} from '../../../../src/view/draggable/draggable-types';
import type { DragImpact, DraggingState } from '../../../../src/types';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import getHomeLocation from '../../../../src/state/get-home-location';
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../util/dimension';
import { type IsDraggingState, withImpact } from '../../../util/dragging-state';
import getStatePreset from '../../../util/get-simple-state-preset';
import { getForcedDisplacement } from '../../../util/impact';
import { withVirtuals } from '../../state/publish-while-dragging/util';
import getOwnProps from './util/get-own-props';
import { getSecondarySnapshot } from './util/get-snapshot';
import noImpact from '../../../../src/state/no-impact';
import { negate } from '../../../../src/state/position';

const preset = getPreset();
const state = getStatePreset();
const ownProps: OwnProps = getOwnProps(preset.inHome2);

describe('before critical', () => {
  it('should return the default props if not impacted by the drag and before critical in virtual list', () => {
    const selector: Selector = makeMapStateToProps();
    const defaultMapProps: MapProps = selector(state.idle, ownProps);
    // inHome2 is before inHome3 and so won't be impacted by the drag
    const current: DraggingState = (withVirtuals(
      (state.dragging(preset.inHome3.descriptor.id): any),
    ): any);

    expect(selector(current, ownProps)).toBe(defaultMapProps);
  });
});

describe('after critical', () => {
  it('should stay in the original visual spot when displaced', () => {
    const selector: Selector = makeMapStateToProps();
    const defaultMapProps: MapProps = selector(state.idle, ownProps);
    const current: DraggingState = (withVirtuals(
      (state.dragging(preset.inHome1.descriptor.id): any),
    ): any);
    const impact: DragImpact = {
      displaced: getForcedDisplacement({
        visible: [
          { dimension: preset.inHome2, shouldAnimate: false },
          { dimension: preset.inHome3, shouldAnimate: false },
          { dimension: preset.inHome4, shouldAnimate: false },
        ],
      }),
      displacedBy: getDisplacedBy(preset.home.axis, preset.inHome1.displaceBy),
      at: {
        type: 'REORDER',
        destination: getHomeLocation(preset.inHome1.descriptor),
      },
    };
    const impacted: IsDraggingState = withImpact(current, impact);

    expect(selector(impacted, ownProps)).toBe(defaultMapProps);
  });

  it('should return the resting props if currently invisible', () => {
    const selector: Selector = makeMapStateToProps();
    const defaultMapProps: MapProps = selector(state.idle, ownProps);
    const current: DraggingState = (withVirtuals(
      (state.dragging(preset.inHome1.descriptor.id): any),
    ): any);
    const impact: DragImpact = {
      displaced: getForcedDisplacement({
        visible: [
          { dimension: preset.inHome3, shouldAnimate: false },
          { dimension: preset.inHome4, shouldAnimate: false },
        ],
        invisible: [preset.inHome2],
      }),
      displacedBy: getDisplacedBy(preset.home.axis, preset.inHome1.displaceBy),
      at: {
        type: 'REORDER',
        destination: getHomeLocation(preset.inHome1.descriptor),
      },
    };
    const impacted: IsDraggingState = withImpact(current, impact);

    expect(selector(impacted, ownProps)).toBe(defaultMapProps);
  });

  it('should animate backwards to close the gap when moving out of a list', () => {
    const selector: Selector = makeMapStateToProps();
    const current: DraggingState = (withVirtuals(
      (state.dragging(preset.inHome1.descriptor.id): any),
    ): any);
    const impacted: IsDraggingState = withImpact(current, noImpact);

    // moving backwards by the size of the dragging item to close the gap
    const offset: Position = negate(
      getDisplacedBy(preset.home.axis, preset.inHome1.displaceBy).point,
    );

    const expected: MapProps = {
      mapped: {
        type: 'SECONDARY',
        // animating backwards
        shouldAnimateDisplacement: true,
        offset,
        combineTargetFor: null,
        snapshot: getSecondarySnapshot({
          combineTargetFor: null,
        }),
      },
    };
    expect(selector(impacted, ownProps)).toEqual(expected);
  });
});
