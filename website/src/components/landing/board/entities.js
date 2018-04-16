// @flow
import { authors, quotes, quoteMap, getByAuthor } from '../../quotes';
import type { Author, Quote, Id } from '../../types';
import type {
  Column,
  ColumnMap,
  Entities,
} from './board-types';

const half: number = quotes.length / 2;

const first: Column = {
  id: 'column-1',
  title: 'Quotes that I ❤️',
  quoteIds: quotes.slice(0, half).map((quote: Quote): Id => quote.id),
};

const second: Column = {
  id: 'column-2',
  title: 'Other quotes',
  quoteIds: quotes.slice(half, quotes.length - 1).map((quote: Quote): Id => quote.id),
};

const columns: Column[] = [first, second];

const columnMap: ColumnMap = columns.reduce((previous: ColumnMap, current: Column) => {
  previous[current.id] = current;
  return previous;
}, {});

const entities: Entities = {
  columns: columnMap,
  quotes: quoteMap,
  columnOrder: columns.map((column: Column): Id => column.id),
};

export default entities;
