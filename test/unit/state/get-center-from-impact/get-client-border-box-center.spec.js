// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  Viewport,
  Axis,
  DragImpact,
  DisplacedBy,
  Displacement,
} from '../../../../src/types';
import { vertical, horizontal } from '../../../../src/state/axis';
import { add, negate, subtract } from '../../../../src/state/position';
import scrollDroppable from '../../../../src/state/droppable/scroll-droppable';
import { getPreset, makeScrollable } from '../../../utils/dimension';
import getClientBorderBoxCenter from '../../../../src/state/get-center-from-impact/get-client-border-box-center';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import { forward } from '../../../../src/state/user-direction/user-direction-preset';
import noImpact from '../../../../src/state/no-impact';
import scrollViewport from '../../../../src/state/scroll-viewport';
import getHomeOnLift from '../../../../src/state/get-home-on-lift';
import getDisplacementMap from '../../../../src/state/get-displacement-map';
import getNotAnimatedDisplacement from '../../../utils/get-displacement/get-not-animated-displacement';

[vertical, horizontal].forEach((axis: Axis) => {
  const preset = getPreset();
  const { onLift, impact: homeImpact } = getHomeOnLift({
    draggable: preset.inHome1,
    draggables: preset.draggables,
    home: preset.home,
    viewport: preset.viewport,
  });

  it('should account for the scroll of the droppable you are over when reordering', () => {
    const scrollableHome: DroppableDimension = makeScrollable(preset.home);
    const scroll: Position = { x: 10, y: 15 };
    const displacement: Position = negate(scroll);
    const scrolled: DroppableDimension = scrollDroppable(
      scrollableHome,
      scroll,
    );

    const newClientCenter: Position = getClientBorderBoxCenter({
      impact: homeImpact,
      draggable: preset.inHome1,
      droppable: scrolled,
      draggables: preset.draggables,
      viewport: preset.viewport,
      onLift,
    });
    const offset: Position = subtract(
      newClientCenter,
      preset.inHome1.client.borderBox.center,
    );

    expect(offset).toEqual(displacement);
  });

  it('should account for the scroll of the droppable you are over when combining', () => {
    const scrollableHome: DroppableDimension = makeScrollable(preset.home);
    const scroll: Position = { x: 10, y: 15 };
    const displacement: Position = negate(scroll);
    const scrolled: DroppableDimension = scrollDroppable(
      scrollableHome,
      scroll,
    );
    // inHome1 combining with inHome2
    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome1.displaceBy,
    );
    const displaced: Displacement[] = [
      getNotAnimatedDisplacement(preset.inHome2),
      getNotAnimatedDisplacement(preset.inHome3),
      getNotAnimatedDisplacement(preset.inHome4),
    ];
    const impact: DragImpact = {
      movement: {
        displaced,
        map: getDisplacementMap(displaced),
        displacedBy,
      },
      direction: axis.direction,
      destination: null,
      merge: {
        whenEntered: forward,
        combine: {
          draggableId: preset.inHome2.descriptor.id,
          droppableId: preset.home.descriptor.id,
        },
      },
    };

    const newClientCenter: Position = getClientBorderBoxCenter({
      impact,
      draggable: preset.inHome1,
      draggables: preset.draggables,
      droppable: scrolled,
      viewport: preset.viewport,
      onLift,
    });
    const offset: Position = subtract(
      newClientCenter,
      preset.inHome1.client.borderBox.center,
    );

    const expectedCenter: Position = preset.inHome2.client.borderBox.center;
    const original: Position = preset.inHome1.client.borderBox.center;
    const centerDiff: Position = subtract(expectedCenter, original);
    const expectedOffset: Position = add(centerDiff, displacement);
    expect(offset).toEqual(expectedOffset);
  });

  it('should account for the scroll of your home list if you are not over any list', () => {
    const scrollableHome: DroppableDimension = makeScrollable(preset.home);
    const scroll: Position = { x: 10, y: 15 };
    const displacement: Position = negate(scroll);
    const scrolled: DroppableDimension = scrollDroppable(
      scrollableHome,
      scroll,
    );

    const newClientCenter: Position = getClientBorderBoxCenter({
      // over nothing
      impact: noImpact,
      draggable: preset.inHome1,
      draggables: preset.draggables,
      droppable: scrolled,
      viewport: preset.viewport,
      onLift,
    });
    const offset: Position = subtract(
      newClientCenter,
      preset.inHome1.client.borderBox.center,
    );

    expect(offset).toEqual(displacement);
  });

  it('should account for any changes in the window scroll', () => {
    const scroll: Position = { x: 10, y: 15 };
    const displacement: Position = negate(scroll);
    const scrolled: Viewport = scrollViewport(
      preset.viewport,
      // adding to the existing scroll
      add(preset.windowScroll, scroll),
    );

    const newClientCenter: Position = getClientBorderBoxCenter({
      impact: noImpact,
      draggable: preset.inHome1,
      draggables: preset.draggables,
      droppable: preset.home,
      viewport: scrolled,
      onLift,
    });
    const offset: Position = subtract(
      newClientCenter,
      preset.inHome1.client.borderBox.center,
    );

    expect(offset).toEqual(displacement);
  });
});
