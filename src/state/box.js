// @flow
import memoizeOne from 'memoize-one';
import type { Spacing, Box } from 'css-box-model';
import type { BoxSpacing, BoxSizing } from '../types';

export const withBoxSpacing = memoizeOne((box: Spacing): BoxSpacing => ({
  paddingTop: box.padding.top,
  paddingRight: box.padding.right,
  paddingBottom: box.padding.bottom,
  paddingLeft: box.padding.left,
  marginTop: box.margin.top,
  marginRight: box.margin.right,
  marginBottom: box.margin.bottom,
  marginLeft: box.margin.left,
  borderTopWidth: box.border.top,
  borderRightWidth: box.border.right,
  borderBottomWidth: box.border.bottom,
  borderLeftWidth: box.border.left,
}));

type WidthAndHeight = {|
  width: number,
  height: number,
|}

export const getBoxSizingHeightAndWidth = memoizeOne((box: Box, boxSizing: BoxSizing): WidthAndHeight => {
  const isBorderBox: boolean = boxSizing === 'border-box';
  const width: number = isBorderBox ? box.borderBox.width : box.contentBox.width;
  const height: number = isBorderBox ? box.borderBox.height : box.contentBox.height;

  return { width, height };
});
