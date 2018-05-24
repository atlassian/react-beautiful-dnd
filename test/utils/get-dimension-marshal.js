// @flow
import bindActionCreators from 'redux';
import createDimensionMarshal from '../../src/state/dimension-marshal/dimension-marshal';
import {
  bulkCollectionStarting,
  bulkReplace,
  updateDroppableScroll,
  updateDroppableIsEnabled,
} from '../../src/state/action-creators';
import type { DimensionMarshal, Callbacks } from '../../src/state/dimension-marshal/dimension-marshal-types';

export default (dispatch: Function): DimensionMarshal => {
  const callbacks: Callbacks = bindActionCreators({
    bulkCollectionStarting,
    bulkReplace,
    updateDroppableScroll,
    updateDroppableIsEnabled,
  }, dispatch);

  const marshal: DimensionMarshal = createDimensionMarshal(callbacks);

  return marshal;
};

