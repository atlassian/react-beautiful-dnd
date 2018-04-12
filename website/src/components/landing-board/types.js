// @flow
import { type Node } from 'react';

type ItemId = string;
type ColumnId = string;

export type Feature = {|
  id: ItemId,
  component: Node,
|}

export type Column = {|
  id: ColumnId,
  title: string,
  itemIds: ItemId[],
|}

export type ColumnMap = {
  [id: ColumnId]: Column,
}

export type FeatureMap = {
  [id: ItemId]: ItemId,
}

export type Entities = {|
  columnOrder: ColumnId[],
  columns: ColumnMap,
  features: FeatureMap,
|}

