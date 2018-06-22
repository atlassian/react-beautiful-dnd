// @flow
import React, { Component, type Element } from 'react';
import type { SpringHelperConfig } from 'react-motion/lib/Types';
import { type Position } from 'css-box-model';
import { Motion, spring } from 'react-motion';
import { isEqual } from '../../state/position';
import { physics } from '../animation';
import type { Props, Speed, DefaultProps } from './moveable-types';

type PositionLike = {|
  x: any,
  y: any,
|};

const origin: Position = { x: 0, y: 0 };

type BlockerProps = {|
  change: Position,
  children: (Position) => Element<*>,
|}

// Working around react-motion double render issue
class DoubleRenderBlocker extends React.Component<BlockerProps> {
  shouldComponentUpdate(nextProps: BlockerProps): boolean {
    // let a render go through if not moving anywhere
    if (isEqual(origin, nextProps.change)) {
      return true;
    }

    // blocking a duplicate change (workaround for react-motion)
    if (isEqual(this.props.change, nextProps.change)) {
      return false;
    }

    // let everything else through
    return true;
  }
  render() {
    return this.props.children(this.props.change);
  }
}

export default class Moveable extends Component<Props> {
  /* eslint-disable react/sort-comp */
  static defaultProps: DefaultProps = {
    destination: origin,
  }

  getFinal(): PositionLike {
    const destination: Position = this.props.destination;
    const speed: Speed = this.props.speed;

    if (speed === 'INSTANT') {
      return destination;
    }

    const config: SpringHelperConfig = speed === 'FAST' ? physics.fast : physics.standard;

    return {
      x: spring(destination.x, config),
      y: spring(destination.y, config),
    };
  }

  render() {
    const final = this.getFinal();

    // bug with react-motion: https://github.com/chenglou/react-motion/issues/437
    // even if both defaultStyle and style are {x: 0, y: 0 } if there was
    // a previous animation it uses the last value rather than the final value

    return (
      <Motion defaultStyle={origin} style={final} onRest={this.props.onMoveEnd}>
        {(current: { [string]: number }): Element<*> => {
          const { speed, destination, children } = this.props;

          const target: Position = speed === 'INSTANT' ? destination : (current: any);

          return (
            <DoubleRenderBlocker change={target}>{children}</DoubleRenderBlocker>
          );
        }}
      </Motion>
    );
  }
}
