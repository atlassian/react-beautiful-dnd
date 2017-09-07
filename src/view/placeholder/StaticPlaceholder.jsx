// @flow
import React, { PureComponent } from 'react';

type Props = {|
  height: number,
  width: number,
|};

export default class StaticPlaceholder extends PureComponent {
  props: Props

  render() {
    const { height, width } = this.props;
    const style = {
      height,
      pointerEvents: 'none',
      width,
    };
    return <div style={style} />;
  }
}
