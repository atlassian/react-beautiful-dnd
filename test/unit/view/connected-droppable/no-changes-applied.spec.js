// @flow
import getStatePreset from '../../../utils/get-simple-state-preset';
import { makeMapStateToProps } from '../../../../src/view/droppable/connected-droppable';
import type { DraggingState } from '../../../../src/types';
import type {
  OwnProps,
  Selector,
  MapProps,
} from '../../../../src/view/droppable/droppable-types';
import getOwnProps from './get-own-props';
import { getPreset } from '../../../utils/dimension';

const preset = getPreset();
const state = getStatePreset();

it('should not apply any changes until the onDragStart callback is called', () => {
  const ownProps: OwnProps = getOwnProps(preset.home);
  const withChanges: DraggingState = state.dragging(
    preset.inHome1.descriptor.id,
  );
  const withoutChanges: DraggingState = {
    // for flow
    phase: 'DRAGGING',
    ...withChanges,
    shouldApplyChanges: false,
  };

  const selector: Selector = makeMapStateToProps();
  const defaultMapProps: MapProps = selector(state.idle, ownProps);

  expect(selector(withoutChanges, ownProps)).toEqual(defaultMapProps);

  // validation
  const propsWithChanges: MapProps = {
    isDraggingOver: true,
    draggingOverWith: preset.inHome1.descriptor.id,
    // no placeholder when dragging in own list
    placeholder: null,
  };
  expect(selector(withChanges, ownProps)).toEqual(propsWithChanges);
});
