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
    const { top, left, bottom, right } = placeholder.margin;
    const { width, height } = placeholder.paddingBox;

    const style = {
      width,
      height,
      marginTop: top,
      marginLeft: left,
      marginBottom: bottom,
      marginRight: right,
      pointerEvents: 'none',
      boxSizing: 'border-box',
    };
    return (
      <div style={style} />
    );
  }
}
