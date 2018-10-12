// @flow

it('should account for the scroll of the droppable you are over when reordering', () => {
  const scrollableHome: DroppableDimension = makeScrollable(preset.home);
  const scroll: Position = { x: 10, y: 15 };
  const displacement: Position = negate(scroll);
  const scrolled: DroppableDimension = scrollDroppable(scrollableHome, scroll);
  const withScrolled: DimensionMap = {
    ...preset.dimensions,
    droppables: {
      ...preset.droppables,
      [scrolled.descriptor.id]: scrolled,
    },
  };
  const impact: DragImpact = getHomeImpact(preset.inHome1, preset.home);

  const result: Position = getPageBorderBoxCenter({
    reason: 'DROP',
    impact,
    draggable: preset.inHome1,
    dimensions: withScrolled,
    viewport: preset.viewport,
  });

  expect(result).toEqual(displacement);
});

it('should account for the scroll of the droppable you are over when combining', () => {
  const scrollableHome: DroppableDimension = makeScrollable(preset.home);
  const scroll: Position = { x: 10, y: 15 };
  const displacement: Position = negate(scroll);
  const scrolled: DroppableDimension = scrollDroppable(scrollableHome, scroll);
  const withScrolled: DimensionMap = {
    ...preset.dimensions,
    droppables: {
      ...preset.droppables,
      [scrolled.descriptor.id]: scrolled,
    },
  };
  // inHome1 combining with inHome2
  const willDisplaceForward: boolean = false;
  const displacedBy: DisplacedBy = getDisplacedBy(
    axis,
    preset.inHome1.displaceBy,
    willDisplaceForward,
  );
  const impact: DragImpact = {
    movement: {
      displaced: [],
      map: {},
      willDisplaceForward,
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

  const result: Position = getPageBorderBoxCenter({
    reason: 'DROP',
    impact,
    draggable: preset.inHome1,
    dimensions: withScrolled,
    viewport: preset.viewport,
  });

  const expectedCenter: Position = preset.inHome2.client.borderBox.center;
  const original: Position = preset.inHome1.client.borderBox.center;
  const centerDiff: Position = subtract(expectedCenter, original);
  const expectedOffset: Position = add(centerDiff, displacement);
  expect(result).toEqual(expectedOffset);
});

it('should account for the scroll of your home list if you are not over any list', () => {
  const scrollableHome: DroppableDimension = makeScrollable(preset.home);
  const scroll: Position = { x: 10, y: 15 };
  const displacement: Position = negate(scroll);
  const scrolled: DroppableDimension = scrollDroppable(scrollableHome, scroll);
  const withScrolled: DimensionMap = {
    ...preset.dimensions,
    droppables: {
      ...preset.droppables,
      [scrolled.descriptor.id]: scrolled,
    },
  };

  const result: Position = getPageBorderBoxCenter({
    reason: 'DROP',
    impact: noImpact,
    draggable: preset.inHome1,
    dimensions: withScrolled,
    viewport: preset.viewport,
  });

  expect(result).toEqual(displacement);
});

it('should account for any changes in the window scroll', () => {
  const scroll: Position = { x: 10, y: 15 };
  const displacement: Position = negate(scroll);
  const scrolled: Viewport = scrollViewport(
    preset.viewport,
    // adding to the existing scroll
    add(preset.windowScroll, scroll),
  );

  const result: Position = getPageBorderBoxCenter({
    reason: 'DROP',
    impact: noImpact,
    draggable: preset.inHome1,
    dimensions: preset.dimensions,
    viewport: scrolled,
  });

  expect(result).toEqual(displacement);
});
