// @flow
import { getPreset } from '../../../utils/dimension';
import isHomeOf from '../../../../src/state/droppable/is-home-of';

const preset = getPreset();

it('should return true if destination is home of draggable', () => {
  expect(isHomeOf(preset.inHome1, preset.home)).toBe(true);
  expect(isHomeOf(preset.inHome2, preset.home)).toBe(true);
  expect(isHomeOf(preset.inForeign1, preset.foreign)).toBe(true);
});

it('should return false if destination is not home of draggable', () => {
  expect(isHomeOf(preset.inForeign1, preset.home)).toBe(false);
  expect(isHomeOf(preset.inHome1, preset.foreign)).toBe(false);
});
