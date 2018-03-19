// @flow
import React, { Component } from 'react';
import { Motion, spring } from 'react-motion';
import { physics } from '../animation';
import type { Position, DraggableLock } from '../../types';
import type { Props, DefaultProps, Style } from './moveable-types';

type PositionLike = {|
  x: any,
  y: any,
|};

const origin: Position = {
  x: 0,
  y: 0,
};

const noMovement: Style = {
  transform: null,
};

const isAtOrigin = (point: PositionLike): boolean =>
  point.x === origin.x && point.y === origin.y;

const getStyle = (isNotMoving: boolean, x: number, y: number, lock: ?DraggableLock): Style => {
  if (isNotMoving) {
    return noMovement;
  }

  const point: Position = { x, y };
  // not applying any transforms when not moving
  if (isAtOrigin(point)) {
    return noMovement;
  }
  const style: Style = {
    transform: `translate(${lock === 'x' ? 0 : point.x}px, ${lock === 'y' ? 0 : point.y}px)`,
  };
  return style;
};

export default class Moveable extends Component<Props> {
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
    const isNotMoving: boolean = isAtOrigin(final);

    return (
      // Expecting a flow error
      // React Motion type: children: (interpolatedStyle: PlainStyle) => ReactElement
      // Our type: children: (Position) => (Style) => React.Node
      // $ExpectError
      <Motion defaultStyle={origin} style={final} onRest={this.onRest}>
        {(current: Position) =>
          this.props.children(
            getStyle(isNotMoving, current.x, current.y, this.props.lock)
          )}
      </Motion>
    );
  }
}
