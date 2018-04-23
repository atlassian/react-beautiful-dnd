// @flow
import { getRect } from 'css-box-model';
import type { Position } from '../types';

export default (el: HTMLElement): Position =>
  getRect(el.getBoundingClientRect()).center;
