// @flow
import type { Position } from 'css-box-model';
import type { Result } from './move-to-next-place-types';
import type { DragImpact } from '../../../types';
import { subtract } from '../../position';

type Args = {|
  previousPageBorderBoxCenter: Position,
  newPageBorderBoxCenter: Position,
  impact: DragImpact,
  isVisibleInNewLocation: boolean,
|};

export default ({
  previousPageBorderBoxCenter,
  newPageBorderBoxCenter,
  impact,
  isVisibleInNewLocation,
}: Args): Result => {
  if (isVisibleInNewLocation) {
    return {
      pageBorderBoxCenter: newPageBorderBoxCenter,
      impact,
      scrollJumpRequest: null,
    };
  }

  // The full distance required to get from the previous page center to the new page center
  const distance: Position = subtract(
    newPageBorderBoxCenter,
    previousPageBorderBoxCenter,
  );

  return {
    pageBorderBoxCenter: previousPageBorderBoxCenter,
    impact,
    scrollJumpRequest: distance,
  };
};
