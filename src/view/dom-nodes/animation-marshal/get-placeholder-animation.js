// @flow
import type { Placeholder } from '../../../types';

// https://css-tricks.com/snippets/css/keyframe-animation-syntax/
const prefixes: string[] = [
  '@-webkit-keyframes',
  '@-moz-keyframes',
  '@-o-keyframes',
  '@keyframes',
];

const getPrefixed = (animationName: string, rule: string): string =>
  prefixes
    .map((prefix: string) => `${prefix} ${animationName} { ${rule} }`)
    .join(' ');

export default (styleContext: string, placeholder: Placeholder): string => {
  const { client } = placeholder;
  const rule: string = `
    from {
      width: 0px;
      height: 0px;
      margin-top: 0px;
      margin-right: 0px;
      margin-bottom: 0px;
      margin-left: 0px;
    }

    to {
      width: ${client.borderBox.width}px;
      height: ${client.borderBox.height}px;
      margin-top: ${client.margin.top}px;
      margin-right: ${client.margin.right}px;
      margin-bottom: ${client.margin.bottom}px;
      margin-left: ${client.margin.left}px;
    }
  `;

  // TODO: generate better animation name
  return getPrefixed('placeholder-in', rule);
};
