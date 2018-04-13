// @flow
import React, { PureComponent } from 'react';
import type { Placeholder as PlaceholderType } from '../../types';

type Props = {|
  placeholder: PlaceholderType,
|}

export default class Placeholder extends PureComponent<Props> {
  render() {
    // We apply the margin separately to maintain margin collapsing
    // behavior of the original element
    const placeholder: PlaceholderType = this.props.placeholder;
    const { paddingBox, margin, display, tagName } = placeholder;

    const style = {
      display,
      // These width and height properties will already be adjusted
      // to the correct box-sizing
      // box-sizing: content-box => width includes padding
      // box-sizing: border-box => width does not include padding
      width: paddingBox.width,
      height: paddingBox.height,
      marginTop: margin.top,
      marginLeft: margin.left,
      marginBottom: margin.bottom,
      marginRight: margin.right,
      pointerEvents: 'none',
      boxSizing: 'border-box',
      // Avoiding the collapsing or growing of this element when pushed by flex child siblings.
      // We have already taken a snapshot the current dimensions we do not want this element
      // to recalculate its dimensions
      flexShrink: '0',
      flexGrow: '0',
    };

    return React.createElement(tagName, { style });
  }
}
