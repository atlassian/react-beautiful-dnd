// @flow
import type { DraggableId, DraggableLocation } from '../../src/types';

export type Author = {|
  name: string,
  avatarUrl: string,
  url: string,
|}

export type Quote = {|
  id: string,
  content: string,
  author: Author
|}

export type Dragging = {|
  id: DraggableId,
  location: DraggableLocation,
|}
