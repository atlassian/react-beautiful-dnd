// @flow
import { authors, quotes, quoteMap, getByAuthor } from '../../quotes';
import type { Author, Quote, Id } from '../../types';
import type {
  Column,
  ColumnMap,
  Entities,
} from './board-types';

const columns: Column[] = authors.map((author: Author): Column => {
  const quoteIds: Id[] = getByAuthor(author, quotes).map((quote: Quote): Id => quote.id);
  const column: Column = {
    id: author.id,
    author,
    quoteIds,
  };
  return column;
});

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
