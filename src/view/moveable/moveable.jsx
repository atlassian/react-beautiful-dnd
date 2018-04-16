// @flow
import React, { Component } from 'react';
import { Spring } from 'react-spring';
import { physics } from '../animation';
import type { Position } from '../../types';
import type { Props, DefaultProps, Style } from './moveable-types';

const origin: Position = {
  x: 0,
  y: 0,
};

export default class Movable extends Component<Props> {
  /* eslint-disable react/sort-comp */

  static defaultProps: DefaultProps = {
    destination: origin,
  }
  /* eslint-enable */
  onRest = () => {
    const { onMoveEnd } = this.props;

    if (!onMoveEnd) {
      return;
    }

    // Could check to see if another move has started
    // and abort the previous onMoveEnd
    setTimeout(() => onMoveEnd());
  }

  render() {
    const speed = this.props.speed;
    const destination = this.props.destination;
    const immediate = speed === 'INSTANT';
    const from = { transform: `translate(${origin.x}px, ${origin.y}px)` };
    const to = { transform: `translate(${destination.x}px, ${destination.y}px)` };
    const config = speed === 'FAST' ? physics.fast : physics.standard;
    return (
      <Spring immediate={immediate} config={config} from={from} to={to} onRest={this.onRest}>
        {this.props.children}
      </Spring>
    );
  }
}
