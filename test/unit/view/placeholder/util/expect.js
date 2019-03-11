// @flow
import type { PlaceholderStyle } from '../../../../../src/view/placeholder/placeholder-types';
import { placeholder } from './data';

export const expectIsEmpty = (style: PlaceholderStyle) => {
  expect(style.width).toBe(0);
  expect(style.height).toBe(0);
  expect(style.marginTop).toBe(0);
  expect(style.marginRight).toBe(0);
  expect(style.marginBottom).toBe(0);
  expect(style.marginLeft).toBe(0);
};

export const expectIsFull = (style: PlaceholderStyle) => {
  expect(style.width).toBe(placeholder.client.borderBox.width);
  expect(style.height).toBe(placeholder.client.borderBox.height);
  expect(style.marginTop).toBe(placeholder.client.margin.top);
  expect(style.marginRight).toBe(placeholder.client.margin.right);
  expect(style.marginBottom).toBe(placeholder.client.margin.bottom);
  expect(style.marginLeft).toBe(placeholder.client.margin.left);
};
