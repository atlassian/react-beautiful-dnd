// @flow
import { css } from 'styled-components';

export const singleColumn = (...args: mixed[]) => `@media screen and (max-width: 1350px) { ${css(...args)} }`;
