// @flow
import { invariant } from '../../../../src/invariant';
import getStatePreset from '../../../util/get-simple-state-preset';
import type {
  Published,
  DraggableDimension,
  DropPendingState,
  DraggingState,
  DragImpact,
  DisplacementGroups,
  DisplacedBy,
  CollectingState,
} from '../../../../src/types';
import publish from '../../../../src/state/publish-while-dragging-in-virtual';
import { getPreset, getDraggableDimension } from '../../../util/dimension';
import { empty, withVirtuals, virtualHome } from './util';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import { vertical } from '../../../../src/state/axis';
import { origin } from '../../../../src/state/position';
import { getForcedDisplacement } from '../../../util/impact';

const state = getStatePreset();
const preset = getPreset(vertical);

it('should speculatively increase the impact', () => {
  const displacedBy: DisplacedBy = getDisplacedBy(
    vertical,
    preset.inHome1.displaceBy,
  );
  const inSingleOverscan: DraggableDimension = getDraggableDimension({
    descriptor: {
      ...preset.inHome4.descriptor,
      index: preset.inHome4.descriptor.index + 1,
      id: 'single',
    },
    borderBox: {
      ...preset.home.client.borderBox,
      top: preset.home.client.borderBox.bottom + 1,
      bottom: preset.home.client.borderBox.bottom + 100,
    },
    windowScroll: preset.windowScroll,
  });
  const double: number = displacedBy.value * 2;
  const inDoubleOverscan: DraggableDimension = getDraggableDimension({
    descriptor: {
      ...preset.inHome4.descriptor,
      index: preset.inHome4.descriptor.index + 2,
      id: 'double',
    },
    borderBox: {
      ...preset.home.client.borderBox,
      top: preset.home.client.borderBox.bottom + double,
      bottom: preset.home.client.borderBox.bottom + double + 10,
    },
    windowScroll: preset.windowScroll,
  });
  const inTripleOverscan: DraggableDimension = getDraggableDimension({
    descriptor: {
      ...preset.inHome4.descriptor,
      index: preset.inHome4.descriptor.index + 3,
      id: 'triple',
    },
    borderBox: {
      ...preset.home.client.borderBox,
      top: preset.home.client.borderBox.bottom + double + 1,
      bottom: preset.home.client.borderBox.bottom + double + 10,
    },
    windowScroll: preset.windowScroll,
  });
  const published: Published = {
    ...empty,
    additions: [inSingleOverscan, inDoubleOverscan, inTripleOverscan],
    modified: [{ droppableId: virtualHome.descriptor.id, scroll: origin }],
  };

  const original: CollectingState = withVirtuals(state.collecting());
  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  invariant(result.phase === 'DRAGGING');

  const displaced: DisplacementGroups = getForcedDisplacement({
    visible: [
      { dimension: preset.inHome2, shouldAnimate: false },
      { dimension: preset.inHome3, shouldAnimate: false },
      { dimension: preset.inHome4, shouldAnimate: false },
      { dimension: inSingleOverscan, shouldAnimate: false },
      { dimension: inDoubleOverscan, shouldAnimate: false },
    ],
    invisible: [inTripleOverscan],
  });
  const expected: DragImpact = {
    displacedBy,
    displaced,
    at: original.onLiftImpact.at,
  };
  expect(result.onLiftImpact).toEqual(expected);
  expect(result.impact).toEqual(expected);
});
