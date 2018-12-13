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
  on: mixed,
  shouldAnimate: boolean,
  children: (provided: AnimateProvided) => Node | null,
|};

type State = {|
  data: mixed,
  isVisible: boolean,
  animate: AnimationMode,
|};

export default class AnimateMount extends React.Component<Props, State> {
  state: State = {
    isVisible: Boolean(this.props.on),
    data: this.props.on,
    // not allowing 'close' when mounting
    animate: this.props.shouldAnimate ? 'open' : 'none',
  };

  static getDerivedStateFromProps(props: Props, state: State): State {
    if (!props.shouldAnimate) {
      return {
        isVisible: Boolean(props.on),
        data: props.on,
        animate: 'none',
      };
    }
    // need to animate in
    if (props.on) {
      return {
        isVisible: true,
        // have new data to animate in with
        data: props.on,
        animate: 'open',
      };
    }

    // need to animate out if there was data
    return {
      isVisible: state.isVisible,
      // use old data for animating out
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
