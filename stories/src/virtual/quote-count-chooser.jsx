// @flow
import React from 'react';
import { css } from '@emotion/core';
import { colors } from '@atlaskit/theme';
import { grid, borderRadius } from '../constants';

type Props = {|
  count: number,
  onCountChange: (count: number) => void,
|};

type Option = {|
  name: string,
  value: number,
|};

const options: Option[] = [
  { name: 'Small', value: 8 },
  { name: 'Medium', value: 500 },
  { name: 'Large', value: 10000 },
];

export default function QuoteCountChooser(props: Props) {
  function onChange(event: SyntheticInputEvent<HTMLSelectElement>) {
    const value: number = Number(event.target.value);
    props.onCountChange(value);
  }

  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
      `}
    >
      <div
        css={css`
          align-self: center;
          background-color: ${colors.N0};
          padding: ${grid}px;
          border-radius: ${borderRadius}px;
        `}
      >
        <h4
          css={css`
            margin-bottom: ${grid}px;
          `}
        >
          <a href="https://github.com/bvaughn/react-window">
            <code>react-window</code>
          </a>
        </h4>
        <select
          onChange={onChange}
          value={props.count}
          css={css`
            width: 200px;
            font-size: 16px;
          `}
        >
          {options.map((option: Option) => (
            <option key={option.name} value={option.value}>
              {option.name} ({option.value})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
