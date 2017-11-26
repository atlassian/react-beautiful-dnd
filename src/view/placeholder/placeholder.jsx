// @flow
import React, { PureComponent } from 'react';
import type { Placeholder as PlaceholderType } from '../../types';

type Props = {|
  placeholder: PlaceholderType,
|}

export default class Placeholder extends PureComponent<Props> {
  render() {
    const placeholder: PlaceholderType = this.props.placeholder;
    const { top, left, bottom, right } = placeholder.margin;
    const { width, height } = placeholder.withoutMargin;

    const style = {
      width,
      height,
      marginTop: top,
      marginLeft: left,
      marginBottom: bottom,
      marginRight: right,
      pointerEvents: 'none',
    };
    return (
      <div style={style} />
    );
  }
}
