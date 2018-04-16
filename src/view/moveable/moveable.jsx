// @flow
import React, { Component } from 'react';
import { Spring } from 'react-spring';
import { physics } from '../animation';
import type { Props, Style } from './moveable-types';

export default class Movable extends Component<Props> {
  /* eslint-enable */
  onRest = () => {
    const { onMoveEnd } = this.props;

    if (!onMoveEnd) {
      return;
    }

    // This needs to be async otherwise Motion will not re-execute if
    // offset or start change

    // Could check to see if another move has started
    // and abort the previous onMoveEnd
    setTimeout(() => onMoveEnd());
  }

  render() {
    const { destination, speed, children } = this.props
    const immediate = speed === 'INSTANT';
    const from = { transform: `translate(0px, 0px)` }
    const to = { transform: `translate(${destination.x}px, ${destination.y}px)` }
    const config = speed === 'FAST' ? physics.fast : physics.standard;
    return (
      <Spring immediate={immediate} config={config} from={from} to={to} onRest={this.onRest}>
        {children}
      </Spring>
    );
  }
}
