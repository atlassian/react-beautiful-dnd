// @flow
import { getRect, type Spacing } from 'css-box-model';
import clip from '../../../../src/state/droppable/util/clip';
import { offsetByPosition } from '../../../../src/state/spacing';

it('should select clip a subject in a frame', () => {
  const subject: Spacing = {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
  };
  const frame: Spacing = {
    top: 20,
    left: 20,
    right: 50,
    bottom: 50,
  };

  expect(clip(frame, subject)).toEqual(getRect(frame));
});

it('should return null when the subject it outside the frame on any side', () => {
  const frame: Spacing = {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
  };
  const outside: Spacing[] = [
    // top
    offsetByPosition(frame, { x: 0, y: -200 }),
    // right
    offsetByPosition(frame, { x: 200, y: 0 }),
    // bottom
    offsetByPosition(frame, { x: 0, y: 200 }),
    // left
    offsetByPosition(frame, { x: -200, y: 0 }),
  ];

  outside.forEach((subject: Spacing) => {
    expect(clip(frame, subject)).toEqual(null);
  });
});
