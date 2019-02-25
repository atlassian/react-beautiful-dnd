// @flow
import invariant from 'tiny-invariant';
import {
  createBox,
  withScroll,
  type BoxModel,
  type Spacing,
} from 'css-box-model';
import type {
  DropPendingState,
  DraggingState,
  CollectingState,
  DroppableDimension,
  DraggableDimension,
  Published,
  Scrollable,
  Displacement,
  DragImpact,
  DisplacedBy,
} from '../../../../../src/types';
import {
  getPreset,
  makeScrollable,
  getFrame,
  addDroppable,
} from '../../../../utils/dimension';
import { isEqual, noSpacing } from '../../../../../src/state/spacing';
import getStatePreset from '../../../../utils/get-simple-state-preset';
import publish from '../../../../../src/state/publish-while-dragging';
import { empty, adjustBox } from '../util';
import { addPlaceholder } from '../../../../../src/state/droppable/with-placeholder';
import getDisplacedBy from '../../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../../src/state/get-displacement-map';
import getVisibleDisplacement from '../../../../utils/get-displacement/get-visible-displacement';

const preset = getPreset();
const state = getStatePreset();
// scrollable, but where frame == subject
const scrollableHome: DroppableDimension = makeScrollable(preset.home, 0);

invariant(
  isEqual(
    scrollableHome.client.marginBox,
    getFrame(scrollableHome).frameClient.marginBox,
  ),
  'Expected scrollableHome to have no scroll area',
);

const added1: DraggableDimension = {
  ...preset.inHome4,
  descriptor: {
    ...preset.inHome4.descriptor,
    index: preset.inHome4.descriptor.index + 1,
    id: 'added1',
  },
};

// $FlowFixMe - wrong type
const original: CollectingState = addDroppable(
  // $FlowFixMe - wrong type
  state.collecting(),
  scrollableHome,
);

it('should adjust a subject in response to a change', () => {
  const expandedSubjectClient: BoxModel = adjustBox(scrollableHome.client, {
    x: 10,
    y: 20,
  });

  const scrollableHomeWithAdjustment: DroppableDimension = {
    ...scrollableHome,
    client: expandedSubjectClient,
    page: withScroll(expandedSubjectClient, preset.windowScroll),
  };

  const published: Published = {
    ...empty,
    additions: [added1],
    modified: [scrollableHomeWithAdjustment],
  };

  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  invariant(result.phase === 'DRAGGING');

  const postUpdateHome: DroppableDimension =
    result.dimensions.droppables[scrollableHome.descriptor.id];

  // droppable client subject has changed
  expect(postUpdateHome.client).toEqual(expandedSubjectClient);
  expect(postUpdateHome.client).toEqual(scrollableHomeWithAdjustment.client);

  // frame has not changed
  expect(getFrame(postUpdateHome).frameClient).toEqual(
    getFrame(scrollableHome).frameClient,
  );
});

it('should throw if the frame size changes', () => {
  const withFrameSizeChanged: DroppableDimension = {
    ...scrollableHome,
    frame: {
      ...scrollableHome.frame,
      // changing the size of the frame
      frameClient: adjustBox(getFrame(scrollableHome).frameClient, {
        x: 5,
        y: 10,
      }),
    },
  };
  const published: Published = {
    ...empty,
    additions: [added1],
    modified: [withFrameSizeChanged],
  };

  expect(() =>
    publish({
      state: original,
      published,
    }),
  ).toThrow(
    'The width and height of your Droppable scroll container cannot change when adding or removing Draggables during a drag',
  );
});

it('should throw if any spacing changes to the client', () => {
  const margin: Spacing = scrollableHome.client.margin;
  const padding: Spacing = scrollableHome.client.padding;
  const border: Spacing = scrollableHome.client.border;

  const withNewSpacing: BoxModel[] = [
    createBox({
      borderBox: scrollableHome.client.borderBox,
      margin: noSpacing,
      padding,
      border,
    }),
    createBox({
      borderBox: scrollableHome.client.borderBox,
      margin,
      padding,
      border: noSpacing,
    }),
    createBox({
      borderBox: scrollableHome.client.borderBox,
      margin,
      padding: noSpacing,
      border,
    }),
  ];

  withNewSpacing.forEach((newClient: BoxModel) => {
    const scrollableHomeWithAdjustment: DroppableDimension = {
      ...scrollableHome,
      client: newClient,
      page: withScroll(newClient, preset.windowScroll),
    };

    const published: Published = {
      ...empty,
      additions: [added1],
      modified: [scrollableHomeWithAdjustment],
    };

    expect(() =>
      publish({
        state: original,
        published,
      }),
    ).toThrow(
      /Cannot change the (margin|padding|border) of a Droppable during a drag/,
    );
  });
});

it('should throw if any spacing changes to the frame', () => {
  const scrollable: Scrollable = getFrame(scrollableHome);
  const frameClient: BoxModel = scrollable.frameClient;
  const margin: Spacing = frameClient.margin;
  const padding: Spacing = frameClient.padding;
  const border: Spacing = frameClient.border;

  const withNewFrameSpacing: BoxModel[] = [
    createBox({
      borderBox: frameClient.borderBox,
      margin: noSpacing,
      padding,
      border,
    }),
    createBox({
      borderBox: frameClient.borderBox,
      margin,
      padding,
      border: noSpacing,
    }),
    createBox({
      borderBox: frameClient.borderBox,
      margin,
      padding: noSpacing,
      border,
    }),
  ];

  withNewFrameSpacing.forEach((withSpacing: BoxModel) => {
    const withFrameSizeChanged: DroppableDimension = {
      ...scrollableHome,
      frame: {
        ...scrollableHome.frame,
        // changing the size of the frame
        frameClient: withSpacing,
      },
    };

    const published: Published = {
      ...empty,
      additions: [added1],
      modified: [withFrameSizeChanged],
    };

    expect(() =>
      publish({
        state: original,
        published,
      }),
    ).toThrow(
      /Cannot change the (margin|padding|border) of a Droppable during a drag/,
    );
  });
});

it('should reapply any dynamic placeholder spacing', () => {
  const draggable: DraggableDimension = preset.inHome1;
  const scrollableForeign: DroppableDimension = makeScrollable(
    preset.foreign,
    0,
  );
  {
    const withPlaceholder: DroppableDimension = addPlaceholder(
      scrollableForeign,
      draggable,
      preset.draggables,
    );
    const displacedBy: DisplacedBy = getDisplacedBy(
      withPlaceholder.axis,
      draggable.displaceBy,
    );
    const displaced: Displacement[] = [
      getVisibleDisplacement(preset.inForeign1),
      getVisibleDisplacement(preset.inForeign2),
      getVisibleDisplacement(preset.inForeign3),
      getVisibleDisplacement(preset.inForeign4),
    ];
    const impact: DragImpact = {
      movement: {
        displacedBy,
        displaced,
        map: getDisplacementMap(displaced),
      },
      merge: null,
      destination: {
        index: preset.inForeign1.descriptor.index,
        droppableId: withPlaceholder.descriptor.id,
      },
    };
    // $FlowFixMe - wrong type
    const whileCollecting: CollectingState = {
      ...addDroppable(
        // $FlowFixMe - wrong type
        state.collecting(),
        withPlaceholder,
      ),
      impact,
    };
    const published: Published = {
      ...empty,
      additions: [],
      // no net size change (placeholder is removed when recollecting)
      modified: [scrollableForeign],
    };

    const result: DraggingState | DropPendingState = publish({
      state: whileCollecting,
      published,
    });
    invariant(result.phase === 'DRAGGING');

    // result has had the placeholder reapplied!
    expect(result.dimensions.droppables[preset.foreign.descriptor.id]).toEqual(
      withPlaceholder,
    );
  }

  // validation: no placeholder added if not over foreign
  {
    // $FlowFixMe - wrong type
    const whileCollecting: CollectingState = addDroppable(
      // $FlowFixMe - wrong type
      state.collecting(),
      scrollableForeign,
    );
    const published: Published = {
      ...empty,
      additions: [],
      // no net size change
      modified: [scrollableForeign],
    };

    const result: DraggingState | DropPendingState = publish({
      state: whileCollecting,
      published,
    });
    invariant(result.phase === 'DRAGGING');

    // result has had the placeholder reapplied!
    expect(result.dimensions.droppables[preset.foreign.descriptor.id]).toEqual(
      scrollableForeign,
    );
  }
});
