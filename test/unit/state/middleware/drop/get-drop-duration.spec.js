// @flow
import type { Position } from 'css-box-model';
import getDropDuration from '../../../../../src/state/middleware/drop/get-drop-duration';

it('should return 0 if not moving anywhere', () => {
  const result: number = getDropDuration({
    current: { x: 10, y: 10 },
    destination: { x: 10, y: 10 },
    reason: 'DROP',
  });
  expect(result).toBe(0);
});

it('should return higher drop times the further away you are', () => {
  const closer: number = getDropDuration({
    current: { x: 1, y: 1 },
    destination: { x: 5, y: 5 },
    reason: 'DROP',
  });
  const further: number = getDropDuration({
    current: { x: 1, y: 1 },
    destination: { x: 100, y: 100 },
    reason: 'DROP',
  });

  expect(closer).toBeLessThan(further);
});

it('should return faster drop times if cancelling', () => {
  const current: Position = { x: 1, y: 1 };
  const destination: Position = { x: 1, y: 10 };
  const cancel: number = getDropDuration({
    current,
    destination,
    reason: 'CANCEL',
  });
  const drop: number = getDropDuration({
    current,
    destination,
    reason: 'DROP',
  });

  expect(cancel).toBeLessThan(drop);
});
