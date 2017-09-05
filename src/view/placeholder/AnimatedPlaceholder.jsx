import styled, { css, keyframes } from 'styled-components';
import { css as transitionStyles } from '../animation';

const animateIn = ({ height, width }) => keyframes`
  from {
    height: 0;
    width: 0;
  }
  to {
    height: ${height}px;
    width: ${width}px;
  }
`;

const animateOut = ({ height, width }) => keyframes`
  from {
    height: ${height}px;
    width: ${width}px;
  }
  to {
    height: 0;
    width: 0;
  }
`;

const AnimatedPlaceholder = styled.div`
  height: ${({ height }) => height}px;
  pointer-events: none;
  width: ${({ width }) => width}px;

  ${({ height, isAnimatingIn, isAnimatingOut, width }) => {
    if (isAnimatingIn) {
      return css`animation: ${transitionStyles.transitionTime} ${animateIn} ${transitionStyles.transitionCurve}`;
    }

    if (isAnimatingOut) {
      return css`animation: 0.2s ${animateOut} cubic-bezier(0.2, 0, 0, 1)`;
    }

    return `
      height: ${height}px;
      width: ${width}px;
    `;
  }}
`;
AnimatedPlaceholder.displayName = 'AnimatedPlaceholder';
export default AnimatedPlaceholder;
