// @flow
import type { Id, Author, QuoteMap } from '../../types';

export type Column = {|
  id: Id,
  author: Author,
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
