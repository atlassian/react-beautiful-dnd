// @flow
import type { Item, Column, ColumnMap } from './types';

const items: Item[] = [
  {
    id: 'mutli-drag',
    component: () => 'Multi drag',
  },
  {
    id: 'scroll-container',
    component: () => 'Scroll containers',
  },
];

const features: Column = {
  id: 'features',
  title: 'Features',
};
const patterns: Column = {
  id: 'patterns',
  title: 'Patterns and guides',
};

const columns: ColumnMap = {
  [features.id]: features,
  [patterns.id]: patterns,
}

const entities: Entities = {
  columns,

};
