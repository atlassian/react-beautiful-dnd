// @flow
import React, { Component, type Element } from 'react';
import memoizeOne from 'memoize-one';
import type { SpringHelperConfig } from 'react-motion/lib/Types';
import { type Position } from 'css-box-model';
import { Motion, spring } from 'react-motion';
import { physics } from '../animation';
import type { Props, DefaultProps } from './moveable-types';

type PositionLike = {|
  x: any,
  y: any,
|};

const origin: Position = { x: 0, y: 0 };

export default class Moveable extends Component<Props> {
  /* eslint-disable react/sort-comp */
  static defaultProps: DefaultProps = {
    destination: origin,
  }
  /* eslint-enable */

  onRest = () => {
    // This needs to be async otherwise Motion will not re-execute if
    // offset or start change

    // Could check to see if another move has started
    // and abort the previous onMoveEnd
    if (this.props.onMoveEnd) {
      setTimeout(this.props.onMoveEnd);
    }
  }

  getFinal = (): PositionLike => {
    const destination: Position = this.props.destination;
    const speed = this.props.speed;

    if (speed === 'INSTANT') {
      return destination;
    }

    const config: SpringHelperConfig = speed === 'FAST' ? physics.fast : physics.standard;

    return {
      x: spring(destination.x, config),
      y: spring(destination.y, config),
    };
  }

  getMemoizedPosition = memoizeOne(
    (x: number, y: number): Position => ({ x, y })
  )

  render() {
    const final = this.getFinal();
    // console.log('final', final);

    // bug with react-motion: https://github.com/chenglou/react-motion/issues/437
    // even if both defaultStyle and style are {x: 0, y: 0 } if there was
    // a previous animation it uses the last value rather than the final value
    // const isMovingToOrigin: boolean = isAtOrigin(final);
    // const shouldInstantMove: boolean =

    return (
      <Motion defaultStyle={origin} style={final} onRest={this.onRest}>
        {(current: { [string]: number }): Element<*> => {
          const { speed, destination, children } = this.props;

          const target: Position = speed === 'INSTANT' ? destination : (current: any);

          return children(this.getMemoizedPosition(target.x, target.y));
        }}
      </Motion>
    );
  }
}
