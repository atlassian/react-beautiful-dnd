// @flow
export type ItemId = string;
export type ColumnId = string;

export type Item = {|
  id: ItemId,
  title: string,
  content: string,
|}

export type Column = {|
  id: ColumnId,
  title: string,
  itemIds: ItemId[],
|}

export type ColumnMap = {
  [id: ColumnId]: Column,
}

export type ItemMap = {
  [id: ItemId]: Item,
}

export type Entities = {|
  columnOrder: ColumnId[],
  columns: ColumnMap,
  items: ItemMap,
|}

