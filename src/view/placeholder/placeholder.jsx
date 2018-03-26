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
      width: paddingBox.width,
      height: paddingBox.height,
      marginTop: margin.top,
      marginLeft: margin.left,
      marginBottom: margin.bottom,
      marginRight: margin.right,
      pointerEvents: 'none',
      boxSizing: 'border-box',
      display,
    };

    return React.createElement(tagName, { style });
  }
}
