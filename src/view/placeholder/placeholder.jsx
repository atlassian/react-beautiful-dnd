// @flow
import React, { PureComponent } from 'react';
import type { Spacing } from 'css-box-model';
import type {
  Placeholder as PlaceholderType,
  InOutAnimationMode,
} from '../../types';
import { transitions } from '../animation';
import { noSpacing } from '../../state/spacing';

export type PlaceholderStyle = {|
  display: string,
  boxSizing: 'border-box',
  width: number,
  height: number,
  marginTop: number,
  marginRight: number,
  marginBottom: number,
  marginLeft: number,
  flexShrink: '0',
  flexGrow: '0',
  pointerEvents: 'none',
  transition: string,
|};
type Props = {|
  placeholder: PlaceholderType,
  animate: InOutAnimationMode,
  onClose: () => void,
  innerRef?: () => ?HTMLElement,
  onTransitionEnd: () => void,
|};

type Size = {|
  width: number,
  height: number,
  // Need to animate in/out animation as well as size
  margin: Spacing,
|};

type State = {|
  isAnimatingOpenOnMount: boolean,
  // useEmpty: boolean,
|};

const empty: Size = {
  width: 0,
  height: 0,
  margin: noSpacing,
};

export default class Placeholder extends PureComponent<Props, State> {
  mountTimerId: ?TimeoutID = null;

  state: State = {
    isAnimatingOpenOnMount: this.props.animate === 'open',
  };

  // called before render() on initial mount and updates
  static getDerivedStateFromProps(props: Props, state: State): State {
    // An animated open is no longer relevant.
    if (state.isAnimatingOpenOnMount && props.animate !== 'open') {
      return {
        isAnimatingOpenOnMount: false,
      };
    }

    return state;
  }

  componentDidMount() {
    if (!this.state.isAnimatingOpenOnMount) {
      return;
    }

    // Ensuring there is one browser update with an empty size
    // .setState in componentDidMount will cause two react renders
    // but only a single browser update
    // https://reactjs.org/docs/react-component.html#componentdidmount
    this.mountTimerId = setTimeout(() => {
      this.mountTimerId = null;

      if (this.state.isAnimatingOpenOnMount) {
        this.setState({
          isAnimatingOpenOnMount: false,
        });
      }
    });
  }

  componentWillUnmount() {
    if (!this.mountTimerId) {
      return;
    }
    clearTimeout(this.mountTimerId);
    this.mountTimerId = null;
  }

  onTransitionEnd = (event: TransitionEvent) => {
    // We transition height, width and margin
    // each of those transitions will independently call this callback
    // Because they all have the same duration we can just respond to one of them
    // 'height' was chosen for no particular reason :D
    if (event.propertyName !== 'height') {
      return;
    }

    this.props.onTransitionEnd();

    if (this.props.animate === 'close') {
      this.props.onClose();
    }
  };

  getSize(): Size {
    if (this.state.isAnimatingOpenOnMount) {
      return empty;
    }

    if (this.props.animate === 'close') {
      return empty;
    }

    const placeholder: PlaceholderType = this.props.placeholder;
    return {
      height: placeholder.client.borderBox.height,
      width: placeholder.client.borderBox.width,
      margin: placeholder.client.margin,
    };
  }

  render() {
    const placeholder: PlaceholderType = this.props.placeholder;
    const size: Size = this.getSize();
    const { display, tagName } = placeholder;

    // The goal of the placeholder is to take up the same amount of space
    // as the original draggable
    const style: PlaceholderStyle = {
      display,
      // ## Recreating the box model
      // We created the borderBox and then apply the margins directly
      // this is to maintain any margin collapsing behaviour

      // creating borderBox
      background: 'green',
      boxSizing: 'border-box',
      width: size.width,
      height: size.height,
      // creating marginBox
      marginTop: size.margin.top,
      marginRight: size.margin.right,
      marginBottom: size.margin.bottom,
      marginLeft: size.margin.left,

      // ## Avoiding collapsing
      // Avoiding the collapsing or growing of this element when pushed by flex child siblings.
      // We have already taken a snapshot the current dimensions we do not want this element
      // to recalculate its dimensions
      // It is okay for these properties to be applied on elements that are not flex children
      flexShrink: '0',
      flexGrow: '0',
      // Just a little performance optimisation: avoiding the browser needing
      // to worry about pointer events for this element
      pointerEvents: 'none',

      // Animate the placeholder size and margin
      transition: transitions.placeholder,
    };

    return React.createElement(tagName, {
      style,
      onTransitionEnd: this.onTransitionEnd,
      ref: this.props.innerRef,
    });
  }
}
