// @flow
import React, { PureComponent } from 'react';
import v4 from 'uuid/v4';
import { css as transitionStyles } from '../animation';
import type { Phase } from '../../types';

type AnimatedProperties = {|
  /** The height of the placeholder */
  height: number,
  /** The width of the placeholder */
  width: number,
|};

type Props = {|
  ...AnimatedProperties,
  /** Whether the parent droppable is being dragged over */
  isDraggedOver: boolean,
  /** The phase of the drag */
  phase: Phase,
|};

type State = {|
  ...AnimatedProperties,
  /** Whether the placeholder should be animating in */
  isAnimatingIn: boolean,
  /** Whether the placeholder should be animating out */
  isAnimatingOut: boolean,
|}

const VENDOR_PREFIXES: string[] = ['-ms-', '-moz-', '-webkit-', ''];
// We inject a stylesheet into the document so that we can dynamically
// add CSS animations.
const stylesheet: HTMLStyleElement = document.createElement('style');
stylesheet.type = 'text/css';
document.getElementsByTagName('head')[0].appendChild(stylesheet);
// A global counter keeping track of how many style rules have been
// added to the stylesheet.
let globalRuleIndex = 0;

export default class Placeholder extends PureComponent {
  // eslint-disable-next-line react/sort-comp
  props: Props

  static defaultProps = {
    isDraggedOver: false,
  }

  state: State = {
    height: this.props.height,
    isAnimatingIn: false,
    isAnimatingOut: false,
    width: this.props.width,
  }

  // Every time we instantiate a new placeholder we record the index
  // of its animation rules, then increment the global counter
  ruleIndex: number = (() => {
    const ruleIndex = globalRuleIndex;
    globalRuleIndex += VENDOR_PREFIXES.length;
    return ruleIndex;
  })()

  componentWillReceiveProps(newProps: Props) {
    if (newProps.phase === this.props.phase &&
      newProps.isDraggedOver === this.props.isDraggedOver) {
      return;
    }

    if (newProps.phase === 'DRAGGING') {
      const height = newProps.height || this.state.height;
      const width = newProps.width || this.state.width;
      const isAnimatingIn = newProps.isDraggedOver;
      const isAnimatingOut = !newProps.isDraggedOver;
      this.setState({ height, isAnimatingIn, isAnimatingOut, width });
    }

    // Reset the state once the drop completes
    if (newProps.phase === 'DROP_COMPLETE') {
      this.setState({
        height: 0,
        isAnimatingIn: false,
        isAnimatingOut: false,
        width: 0,
      });
    }
  }

  getAnimationKeyframes = (animationName: string): string[] => {
    const { height, isAnimatingIn, isAnimatingOut, width } = this.state;
    const expanded = `height: ${height}px; width: ${width}px;`;
    const collapsed = 'height: 0; width: 0;';
    const keyframeSteps = (() => {
      if (isAnimatingIn) {
        return `from { ${collapsed} } to { ${expanded} }`;
      }
      if (isAnimatingOut) {
        return `from { ${expanded} } to { ${collapsed} }`;
      }
      return '';
    })();

    return VENDOR_PREFIXES.map(
      prefix => `@${prefix}keyframes ${animationName} { ${keyframeSteps} }`
    );
  }

  createAnimation = (): ?string => {
    const { sheet } = stylesheet;

    // Stop flow complaining about possibly undefined properties
    if (!sheet ||
      !sheet.cssRules ||
      !sheet.insertRule ||
      !sheet.deleteRule) {
      return null;
    }

    // We need to generate a random name for the animation every time
    // because you can't dynamically update CSS animations
    const animationName = `rbdnd-placeholder-animation-${v4()}`;
    const keyframes = this.getAnimationKeyframes(animationName);
    // It's easier to manage if we inject a dummy rule when the
    // browser doesn't support a prefixed version
    const dummyRule = '.rbdnd-placeholder-donotuse { display: initial; }';
    const { ruleIndex } = this;

    for (let i = 0; i < VENDOR_PREFIXES.length; i++) {
      const thisRuleIndex = ruleIndex + i;
      // `sheet` is a CSSStyleSheet but the definition of HTMLStyleElement indicates that it
      // contains a StyleSheet which doesn't have all the methods of its child CSSStyleSheet
      // $ExpectError - property cssRules not found in StyleSheet
      if (sheet.cssRules[thisRuleIndex]) {
        // $ExpectError - property deleteRule not found in StyleSheet
        sheet.deleteRule(thisRuleIndex);
      }
      // The browser will throw if it doesn't support a prefixed version of the rule
      try {
        // $ExpectError - property insertRule not found in StyleSheet
        sheet.insertRule(keyframes[i], thisRuleIndex);
      } catch (err) {
        // If it doesn't like it we inject a dummy rule instead
        // $ExpectError - property insertRule not found in StyleSheet
        sheet.insertRule(dummyRule, thisRuleIndex);
      }
    }

    return animationName;
  }

  getPlaceholderStyle = () => {
    const { isDraggedOver, phase } = this.props;
    const { height, width } = this.state;

    const animationName = this.createAnimation();

    const staticStyles = {
      height,
      pointerEvents: 'none',
      width,
    };

    // Hold the full height during a drop
    if (phase === 'DROP_ANIMATING' && isDraggedOver) {
      return staticStyles;
    }

    // Animate in/out during a drag
    if (phase === 'DRAGGING') {
      return {
        ...staticStyles,
        animationName,
        animationDuration: transitionStyles.transitionTime,
        animationTimingFunction: transitionStyles.transitionCurve,
        animationDelay: '0.0s',
        animationIterationCount: 1,
        animationDirection: 'normal',
        animationFillMode: 'forwards',
      };
    }

    // Otherwise don't display
    return {
      display: 'none',
    };
  }

  render() {
    return (
      <div style={this.getPlaceholderStyle()} />
    );
  }
}
