// @flow
import getIsInHomeList from '../../../is-in-home-list';
import getHomeImpact from '../../../get-home-impact';
import getWillDisplaceForward from '../../../will-displace-forward';
import type { Result } from '../move-cross-axis-types';
import type {
  Viewport,
  Displacement,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  DisplacedBy,
} from '../../../../types';

type Args = {|
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
|};

export default ({
  draggable,
  destination,
  movingRelativeTo,
  insideDestination: initialInside,
}: Args): Result => {
  const axis: Axis = destination.axis;
  const insideDestination: DraggableDimension[] = initialInside.slice(0);
  const targetIndex: number = insideDestination.indexOf(movingRelativeTo);
  invariant(targetIndex !== -1);

  const isInHomeList: boolean = getIsInHomeList(draggable, destination);

  // moving back to home index
  if (isInHomeList && targetIndex === draggable.descriptor.index) {
    return getHomeImpact(critical, dimensions);
  }

  const willDisplaceForward: boolean = getWillDisplaceForward({
    isInHomeList,
    proposedIndex: targetIndex,
    startIndexInHome: draggable.descriptor.index,
  });

  const needToDisplace: DraggableDimension[] = (() => {})();
};
