// @flow
import React, { PureComponent } from 'react';

export default class Placeholder extends PureComponent {
  props: {|
    height: number,
    width: number,
  |}

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
