// @flow
import type { Position } from 'css-box-model';
import type { ItemPositions } from '../types';
import { add } from './position';

export default (client: ItemPositions, windowScroll: Position): ItemPositions => ({
  selection: add(client.selection, windowScroll),
  borderBoxCenter: add(client.borderBoxCenter, windowScroll),
  offset: add(client.offset, windowScroll),
});

