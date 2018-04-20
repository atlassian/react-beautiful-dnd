// @flow
import { keyframes } from 'styled-components';

const movement: number = 6;

const minorRotation = keyframes`
  0% {
    transform: rotate(0deg);
  }

  25% {
    transform: rotate(${movement}deg);
  }

  50% {
    transform: rotate(0deg);
  }

  75% {
    transform: rotate(-${movement}deg);
  }

  100% {
    transform: rotate(0deg);
  }
`;

export const shake = `${minorRotation} 0.4s linear infinite`;