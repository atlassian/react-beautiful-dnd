// @flow
import type { Position } from '../types';
import getArea from '../state/get-area';

export default (el: HTMLElement): Position =>
  getArea(el.getBoundingClientRect()).center;
