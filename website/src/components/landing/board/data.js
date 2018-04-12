// @flow
import type {
  Item,
  ItemMap,
  Column,
  ColumnMap,
  Entities,
} from './types';

const multiDrag: Item = {
  id: 'multi-drag',
  title: 'Multi drag',
  content: 'You are able to build a multi drag experience',
};

const scrollContainer: Item = {
  id: 'scroll-container',
  title: 'Scroll container support',
  content: 'hehehe',
};

const items: ItemMap = {
  [multiDrag.id]: multiDrag,
  [scrollContainer.id]: scrollContainer,
};

const features: Column = {
  id: 'features',
  title: 'Features',
  itemIds: [multiDrag.id, scrollContainer.id],
};
const patterns: Column = {
  id: 'patterns',
  title: 'Patterns and guides',
  itemIds: [],
};

const columns: ColumnMap = {
  [features.id]: features,
  [patterns.id]: patterns,
};

const entities: Entities = {
  columns,
  items,
  columnOrder: [features.id, patterns.id],
};

export default entities;
