// @flow
import React, { type Node } from 'react';

export type AnimationMode = 'none' | 'open' | 'close';

export type AnimateProvided = {|
  isVisible: boolean,
  onClose: () => void,
  animate: AnimationMode,
  data: mixed,
|};

type Props = {|
  show: boolean,
  data: mixed,
  isAnimationEnabled: boolean,
  children: (provided: AnimateProvided) => Node | null,
|};

type State = {|
  data: mixed,
  isVisible: boolean,
  animate: AnimationMode,
|};

export default class AnimateMount extends React.Component<Props, State> {
  state: State = {
    isVisible: this.props.show,
    data: this.props.data,
    // not allowing 'close' when mounting
    animate: this.props.isAnimationEnabled ? 'open' : 'none',
  };

  static getDerivedStateFromProps(props: Props, state: State): State {
    if (!props.isAnimationEnabled) {
      return {
        isVisible: props.show,
        data: props.data,
        animate: 'none',
      };
    }
    // need to animate in
    if (props.show) {
      return {
        isVisible: true,
        data: props.data,
        animate: 'open',
      };
    }

    // need to animate out

    return {
      isVisible: state.isVisible,
      data: state.data,
      animate: 'close',
    };
  }

  onClose = () => {
    if (this.state.animate !== 'close') {
      return;
    }

    this.setState({
      isVisible: false,
    });
  };

  render() {
    const provided: AnimateProvided = {
      isVisible: this.state.isVisible,
      onClose: this.onClose,
      data: this.state.data,
      animate: this.state.animate,
    };
    return this.props.children(provided);
  }
}
