// @flow
import React from 'react';
import { render } from '@testing-library/react';
import App, { type RenderItem } from '../utils/app';
import { renderItemAndSpy, atRest, getSnapshotsFor } from '../utils/helpers';

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

  render(<App renderItem={renderItem} isCombineEnabled />);

  const snapshots = getSnapshotsFor('0', snapshotSpy);
  expect(snapshots).toHaveLength(1);
  expect(snapshots[0]).toEqual(atRest);
});
