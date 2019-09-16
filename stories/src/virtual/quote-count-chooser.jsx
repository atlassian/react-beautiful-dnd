// @flow
import React, { useCallback } from 'react';
import { css } from '@emotion/core';
import rafSchd from 'raf-schd';

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
          width: 300px;
        `}
      >
        <h4>Quote count: {props.count}</h4>
        <select onChange={onChange} value={props.count}>
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
