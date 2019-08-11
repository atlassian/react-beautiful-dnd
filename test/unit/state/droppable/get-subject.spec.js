// @flow
import {
  type Spacing,
  type Position,
  type BoxModel,
  type Rect,
  getRect,
  createBox,
} from 'css-box-model';
import type {
  Axis,
  DroppableSubject,
  Scrollable,
  ScrollSize,
} from '../../../../src/types';
import getSubject from '../../../../src/state/droppable/util/get-subject';
import { withAssortedSpacing } from '../../../util/dimension';
import { vertical, horizontal } from '../../../../src/state/axis';
import { origin, negate, patch } from '../../../../src/state/position';
import { offsetByPosition } from '../../../../src/state/spacing';
import getMaxScroll from '../../../../src/state/get-max-scroll';

const borderBox: Spacing = {
  top: 0,
  left: 0,
  right: 100,
  bottom: 100,
};
const page: BoxModel = createBox({ borderBox, ...withAssortedSpacing() });

it('should displace by the droppable scroll', () => {
  const scroll: Position = { x: 10, y: 20 };
  const displacement: Position = negate(scroll);
  const scrollSize: ScrollSize = {
    scrollHeight: 100,
    scrollWidth: 100,
  };
  const max: Position = getMaxScroll({
    ...scrollSize,
    height: page.marginBox.height,
    width: page.marginBox.width,
  });
  const frame: Scrollable = {
    // same as subject
    pageMarginBox: page.marginBox,
    // no window scroll
    frameClient: page,
    scrollSize,
    // ignoring clipping for this test
    shouldClipSubject: false,
    scroll: {
      initial: origin,
      current: scroll,
      max,
      diff: {
        value: scroll,
        displacement,
      },
    },
  };

  const result: DroppableSubject = getSubject({
    page,
    withPlaceholder: null,
    axis: vertical,
    frame,
  });

  const expected: DroppableSubject = {
    page,
    withPlaceholder: null,
    active: getRect(offsetByPosition(page.marginBox, displacement)),
  };
  expect(result).toEqual(expected);
});

it('should increase the subject by a placeholder', () => {
  [vertical, horizontal].forEach((axis: Axis) => {
    const increasedBy: Position = patch(axis.line, 100);

    const result: DroppableSubject = getSubject({
      page,
      withPlaceholder: {
        increasedBy,
        placeholderSize: increasedBy,
        oldFrameMaxScroll: null,
      },
      axis,
      frame: null,
    });

    const expected: Rect = getRect({
      ...page.marginBox,
      [axis.end]: page.marginBox[axis.end] + increasedBy[axis.line],
    });
    expect(result.active).toEqual(expected);
  });
});

// other clipping tests covered in 'clip.spec.js'
it('should clip the subject by a frame', () => {
  // frame is smaller than pageMarginBox by 10px on every side
  const frameBorderBox: Rect = getRect({
    top: 10,
    left: 10,
    right: 90,
    bottom: 90,
  });
  const frame: Scrollable = {
    pageMarginBox: frameBorderBox,
    frameClient: createBox({
      borderBox: frameBorderBox,
    }),
    scrollSize: {
      scrollHeight: frameBorderBox.height,
      scrollWidth: frameBorderBox.width,
    },
    shouldClipSubject: true,
    scroll: {
      initial: origin,
      current: origin,
      max: origin,
      diff: {
        value: origin,
        displacement: origin,
      },
    },
  };

  const result: DroppableSubject = getSubject({
    page,
    withPlaceholder: null,
    axis: vertical,
    frame,
  });

  const expected: DroppableSubject = {
    page,
    withPlaceholder: null,
    active: frameBorderBox,
  };
  expect(result).toEqual(expected);
});

it('should do nothing if there is no scroll, placeholder or frame', () => {
  const result: DroppableSubject = getSubject({
    page,
    axis: vertical,
    withPlaceholder: null,
    frame: null,
  });

  const expected: DroppableSubject = {
    page,
    withPlaceholder: null,
    active: page.marginBox,
  };
  expect(result).toEqual(expected);
});
