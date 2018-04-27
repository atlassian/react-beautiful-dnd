// @flow
import { getRect, type Position } from 'css-box-model';

export default (el: HTMLElement): Position =>
  getRect(el.getBoundingClientRect()).center;
