// @flow
import type { BoxModel } from 'css-box-model';
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

const empty: string = `
  width: 0;
  height: 0;
  margin-top: 0;
  margin-right: 0;
  margin-bottom: 0;
  margin-left: 0;
`;

const fill = (box: BoxModel): string => `
  width: ${box.borderBox.width}px;
  height: ${box.borderBox.height}px;
  margin-top: ${box.margin.top}px;
  margin-right: ${box.margin.right}px;
  margin-bottom: ${box.margin.bottom}px;
  margin-left: ${box.margin.left}px;
`;

export default (styleContext: string, placeholder: Placeholder): string => {
  const { client } = placeholder;
  const inAnimation: string = `
    from {
      ${empty}
    }

    to {
      ${fill(client)}
    }
  `;

  const outAnimation: string = `
    from {
      ${fill(client)}
    }

    to {
      ${empty}
    }
  `;

  // TODO: generate better animation name
  // TODO: don't need seperate animation - can have one in reverse
  return `
    ${getPrefixed('placeholder-in', inAnimation)}
    ${getPrefixed('placeholder-out', outAnimation)}
  `;
};
