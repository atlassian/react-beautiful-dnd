// @flow
import { JSDOM } from 'jsdom';
import isElement from '../../../../src/view/is-type-of-element/is-element';

// $FlowFixMe - flow does not know what a SVGElement is
const getSVG = (doc: HTMLDocument): SVGElement =>
  doc.createElementNS('http://www.w3.org/2000/svg', 'svg');

it('should allow all elements through', () => {
  const anchor: HTMLElement = document.createElement('a');
  const svg: SVGElement = getSVG(document);

  expect(isElement(anchor)).toBe(true);
  expect(isElement(svg)).toBe(true);
});

it('should not let other types through', () => {
  [null, 1, true, {}, () => {}].forEach((value: mixed) =>
    expect(isElement(value)).toBe(false),
  );
});

it('should not allow svg elements from another window', () => {
  const other = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
  const anchor: HTMLElement = other.window.document.createElement('a');
  const svg: HTMLElement = getSVG(other.window.document);

  expect(isElement(anchor)).toBe(true);
  expect(isElement(svg)).toBe(true);

  // validation
  expect(svg instanceof Element).toBe(false);
  expect(svg instanceof other.window.Element).toBe(true);
  expect(anchor instanceof Element).toBe(false);
  expect(anchor instanceof other.window.Element).toBe(true);
});
