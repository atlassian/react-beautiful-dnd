// @flow
import type { Axis } from '../../../../src/types';
import { vertical, horizontal } from '../../../../src/state/axis';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on the ${axis.direction} axis`, () => {
    it('should return an empty result when nothing is after the dragging item', () => {});

    it('should correctly mark item visibility', () => {});

    it('should mark an item as not animated when moving from invisible to visible', () => {});

    it('should keep displacement animation consistent between calls', () => {});

    it('should make displacement animated if being displaced for the first time', () => {});

    it('should force the animation value when requested', () => {});
  });
});
