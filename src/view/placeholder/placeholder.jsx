// @flow
import React, { PureComponent } from 'react';

type Props = {|
  height: number,
  width: number,
|}

export default class Placeholder extends PureComponent<Props> {
  render() {
    const style = {
      width: this.props.width,
      height: this.props.height,
      pointerEvents: 'none',
    };
    return (
      <div style={style} />
    );
  }
}
