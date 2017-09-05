// @flow
import React, { PureComponent } from 'react';

import AnimatedPlaceholder from './AnimatedPlaceholder';

type Props = {|
  height: number,
  isVisible: boolean,
  width: number,
|};

type State = {|
  ...Props,
  isAnimatingIn: boolean,
  isAnimatingOut: boolean,
|}

export default class Placeholder extends PureComponent {
  // eslint-disable-next-line react/sort-comp
  props: Props

  state: State = {
    height: this.props.height,
    isAnimatingIn: false,
    isAnimatingOut: false,
    isVisible: this.props.isVisible,
    width: this.props.width,
  }

  node: Node

  componentDidUpdate() {
    if (this.node) {
      this.node.addEventListener('animationend', this.handleAnimationEnd);
    }
  }

  componentWillReceiveProps(newProps: Props) {
    if (this.props.isVisible === newProps.isVisible) {
      return;
    }

    if (!this.props.isVisible) {
      const { height, isVisible, width } = newProps;
      this.setState({
        height,
        isAnimatingIn: true,
        isAnimatingOut: false,
        isVisible,
        width,
      });
      return;
    }

    this.setState({
      isAnimatingIn: false,
      isAnimatingOut: true,
      isVisible: false,
    });
  }

  handleAnimationEnd = () => {
    if (this.state.isAnimatingIn) {
      this.setState({ isAnimatingIn: false });
    }

    if (this.state.isAnimatingOut) {
      this.setState({ isAnimatingOut: false });
    }
  }

  render() {
    const {
      height,
      isAnimatingIn,
      isAnimatingOut,
      isVisible,
      width,
    } = this.state;

    return isAnimatingIn || isAnimatingOut || isVisible ? (
      <AnimatedPlaceholder
        height={height}
        innerRef={(ref) => { this.node = ref; }}
        isAnimatingIn={isAnimatingIn}
        isAnimatingOut={isAnimatingOut}
        width={width}
      />
    ) : null;
  }
}
