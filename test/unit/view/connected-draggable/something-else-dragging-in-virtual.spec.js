// @flow
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
import type {
  Selector,
  OwnProps,
  MapProps,
} from '../../../../src/view/draggable/draggable-types';
import type {
  DragImpact,
  DraggableLocation,
  DisplacedBy,
  DraggingState,
} from '../../../../src/types';

const preset = getPreset();
const state = getStatePreset();
const ownProps: OwnProps = getOwnProps(preset.inHome2);

it('should return the default props if not impacted by the drag and before critical in virtual list', () => {
  const selector: Selector = makeMapStateToProps();
  const defaultMapProps: MapProps = selector(state.idle, ownProps);
  // inHome2 is before inHome3 and so won't be impacted by the drag
  const current: DraggingState = (withVirtuals(
    (state.dragging(preset.inHome3.descriptor.id): any),
  ): any);

  expect(selector(current, ownProps)).toBe(defaultMapProps);
});

describe('being displaced by drag', () => {
  it('should move out of the way with the displacement animation if in virtual list and after critical', () => {
    const displacedBy: DisplacedBy = getDisplacedBy(
      preset.home.axis,
      preset.inHome1.displaceBy,
    );
    const homeLocation: DraggableLocation = getHomeLocation(
      preset.inHome1.descriptor,
    );

    [true, false].forEach(shouldAnimate => {
      const selector: Selector = makeMapStateToProps();
      const impact: DragImpact = {
        displaced: getForcedDisplacement({
          visible: [
            { dimension: preset.inHome2, shouldAnimate },
            { dimension: preset.inHome3, shouldAnimate: false },
            { dimension: preset.inHome4, shouldAnimate: false },
          ],
        }),
        displacedBy: getDisplacedBy(
          preset.home.axis,
          preset.inHome1.displaceBy,
        ),
        at: {
          type: 'REORDER',
          destination: homeLocation,
        },
      };
      const impacted: IsDraggingState = withImpact(state.dragging(), impact);

      const expected: MapProps = {
        mapped: {
          type: 'SECONDARY',
          shouldAnimateDisplacement: shouldAnimate,
          offset: displacedBy.point,
          combineTargetFor: null,
          snapshot: getSecondarySnapshot({
            combineTargetFor: null,
          }),
        },
      };
      expect(selector(impacted, ownProps)).toEqual(expected);
    });
  });
});
