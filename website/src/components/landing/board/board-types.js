// @flow
import { type Node } from 'react';
import type { Id, QuoteMap } from '../../types';

export type Column = {|
  id: Id,
  title: () => Node,
  quoteIds: Id[],
|}

export type ColumnMap = {
  [columnId: Id]: Column
}

export type Entities = {|
  columnOrder: Id[],
  columns: ColumnMap,
  quotes: QuoteMap,
|}
