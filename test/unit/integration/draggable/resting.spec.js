// @flow
import React from 'react';
import { render } from '@testing-library/react';
import App, { type RenderItem, type Item } from '../util/app';
import type { DraggableDescriptor } from '../../../../src';
import {
  renderItemAndSpy,
  atRest,
  getSnapshotsFor,
  getDescriptorsFor,
} from '../util/helpers';

it('should have no movement when at rest', () => {
  const { getByText } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  expect(handle.style.transform).toBe('');
  expect(handle.style.transition).toBe('');
  expect(handle.style.zIndex).toBe('');
});

it('should have a resting snapshot', () => {
  const snapshotSpy = jest.fn();
  const renderItem: RenderItem = renderItemAndSpy(snapshotSpy);

  render(<App renderItem={renderItem} />);

  const snapshots = getSnapshotsFor('0', snapshotSpy);
  expect(snapshots).toHaveLength(1);
  expect(snapshots[0]).toEqual(atRest);
});

it('should be provided with its descriptor', () => {
  const watcher = jest.fn();
  const items = Array.from({ length: 3 }, (v, k): Item => ({
    id: `${k}`,
  }));
  const renderItem: RenderItem = renderItemAndSpy(watcher);

  render(<App renderItem={renderItem} items={items} />);

  items.forEach((item: Item, index: number) => {
    const expected: DraggableDescriptor = {
      id: item.id,
      index,
      type: 'DEFAULT',
      droppableId: 'droppable',
    };
    const descriptors: DraggableDescriptor[] = getDescriptorsFor(
      item.id,
      watcher,
    );

    expect(descriptors).toHaveLength(1);
    expect(descriptors[0]).toEqual(expected);
  });
});
