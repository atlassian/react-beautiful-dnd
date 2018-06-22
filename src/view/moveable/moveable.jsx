// @flow
import React, { Component } from 'react';
import memoizeOne from 'memoize-one';
import { type Position } from 'css-box-model';
import { Motion, spring } from 'react-motion';
import { physics } from '../animation';
import type { Props, DefaultProps, Style } from './moveable-types';

type PositionLike = {|
  x: any,
  y: any,
|};

const origin: Position = {
  x: 0,
  y: 0,
};

const noTransition: Style = {
  transform: null,
};

const getTranslate = memoizeOne((x: number, y: number): Style => ({
  transform: `translate(${x}px, ${y}px)`,
}));

const isAtOrigin = (point: { [string]: number }): boolean =>
  point.x === origin.x && point.y === origin.y;

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

    // This needs to be async otherwise Motion will not re-execute if
    // offset or start change

    // Could check to see if another move has started
    // and abort the previous onMoveEnd
    setTimeout(() => onMoveEnd());
  }

  getFinal = (): PositionLike => {
    const destination: Position = this.props.destination;
    const speed = this.props.speed;

    if (speed === 'INSTANT') {
      return destination;
    }

    const selected = speed === 'FAST' ? physics.fast : physics.standard;

    return {
      x: spring(destination.x, selected),
      y: spring(destination.y, selected),
    };
  }

  render() {
    const final = this.getFinal();

    // bug with react-motion: https://github.com/chenglou/react-motion/issues/437
    // even if both defaultStyle and style are {x: 0, y: 0 } if there was
    // a previous animation it uses the last value rather than the final value
    const isMovingToOrigin: boolean = isAtOrigin(final);

    return (
      // Expecting a flow error
      // React Motion type: children: (interpolatedStyle: PlainStyle) => ReactElement
      // Our type: children: (Position) => (Style) => React.Node
      <Motion defaultStyle={origin} style={final} onRest={this.onRest}>
        {(current: { [string]: number }): any => {
          // If moving to the origin we can just clear the transition
          if (isMovingToOrigin) {
            return this.props.children(noTransition);
          }

          // Rather than having a translate of 0px, 0px we just clear the transition
          if (isAtOrigin(current)) {
            return this.props.children(noTransition);
          }

          // If moving instantly then we can just move straight to the destination
          // Sadly react-motion does a double call in this case so we need to explictly control this
          if (this.props.speed === 'INSTANT') {
            return this.props.children(
              getTranslate(this.props.destination.x, this.props.destination.y)
            );
          }

          return this.props.children(getTranslate(current.x, current.y));
        }}
      </Motion>
    );
  }
}
