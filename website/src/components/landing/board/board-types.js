// @flow
import type { Id, QuoteMap } from '../../types';

export type Column = {|
  id: Id,
  title: string,
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
