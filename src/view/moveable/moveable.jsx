// @flow
import React, { Component } from 'react';
import { Spring } from 'wobble'
import { physics } from '../animation';
import type { Position } from '../../types';
import type { Props, DefaultProps, Style } from './moveable-types';

// type PositionLike = {|
//   x: any,
//   y: any,
// |};

// const origin: Position = {
//   x: 0,
//   y: 0,
// };

// const noMovement: Style = {
//   transform: null,
// };

// const isAtOrigin = (point: PositionLike): boolean =>
//   point.x === origin.x && point.y === origin.y;

// const getStyle = (isNotMoving: boolean, x: number, y: number): Style => {
//   if (isNotMoving) {
//     return noMovement;
//   }

//   const point: Position = { x, y };
//   // not applying any transforms when not moving
//   if (isAtOrigin(point)) {
//     return noMovement;
//   }
//   const style: Style = {
//     transform: `translate(${point.x}px, ${point.y}px)`,
//   };
//   return style;
// };

export default class Moveable extends Component {
  state = {
    x: 0,
    y: 0
  }

  springs = {
    x: new Spring(),
    y: new Spring()
  }

  componentDidMount() {
    this.springs.x.onUpdate(event => this.setState({ x: event.currentValue })).onStop(this.props.onMoveEnd)
    this.springs.y.onUpdate(event => this.setState({ y: event.currentValue })).onStop(this.props.onMoveEnd)
  }

  componentDidUpdate(lastProps) {
    const { destination, speed } = this.props
    if (lastProps.speed !== speed && speed !== 'INSTANT') {
      const config = speed === 'FAST' ? physics.fast : physics.standard;
      this.springs.x.updateConfig({
        fromValue: lastProps.destination.x,
        toValue: destination.x,
        ...config
      }).start()
      this.springs.y.updateConfig({
        fromValue: lastProps.destination.x,
        toValue: destination.y,
        ...config
      }).start()
    }
  }

  render() {
    const current = this.props.speed === 'INSTANT' ? this.props.destination : this.state
    return this.props.children({
      transform: `translate(${current.x}px, ${current.y}px)`,
    })
  }
}
