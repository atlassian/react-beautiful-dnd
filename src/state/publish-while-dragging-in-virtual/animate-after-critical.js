// @flow
import type {
  DragImpact,
  Displacement,
  DisplacementMap,
  LiftEffect,
} from '../../types';
import { values } from '../../native-with-fallback';

type Args = {|
  impact: DragImpact,
  afterCritical: LiftEffect,
|};

export default function animateAfterCritical({
  impact,
  afterCritical,
}: Args): DragImpact {
  const visible: DisplacementMap = values(impact.displaced.visible)
    .map((displacement: Displacement): Displacement => {
      if (afterCritical.effected[displacement.draggableId]) {
        return {
          draggableId: displacement.draggableId,
          shouldAnimate: true,
        };
      }

      return displacement;
    })
    .reduce((acc: DisplacementMap, value: Displacement): DisplacementMap => {
      acc[value.draggableId] = value;
      return acc;
    }, {});

  return {
    ...impact,
    displaced: {
      ...impact.displaced,
      visible,
    },
  };
}
