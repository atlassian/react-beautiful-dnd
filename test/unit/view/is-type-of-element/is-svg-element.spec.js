// @flow
import { JSDOM } from 'jsdom';
import isSvgElement from '../../../../src/view/is-type-of-element/is-svg-element';

// $FlowFixMe - flow does not know what a SVGElement is
const getSVG = (doc: HTMLDocument): SVGElement =>
  doc.createElementNS('http://www.w3.org/2000/svg', 'svg');

it('should allow svg elements through', () => {
  const svg: SVGElement = getSVG(document);

  expect(svg instanceof SVGElement).toBe(true);
  expect(isSvgElement(svg)).toBe(true);
});

it('should not allow html elements through', () => {
  const anchor: HTMLElement = document.createElement('a');

  expect(isSvgElement(anchor)).toBe(false);
});

it('should allow svg elements from another window', () => {
  const other = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
  const svg: HTMLElement = getSVG(other.window.document);

  expect(isSvgElement(svg)).toBe(true);
  // validation
  expect(svg instanceof SVGElement).toBe(false);
  expect(svg instanceof other.window.SVGElement).toBe(true);
});

it('should not allow html elements from another window', () => {
  const other = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
  const anchor: HTMLElement = other.window.document.createElement('a');

  // normally would not pass an instanceof check
  expect(anchor instanceof HTMLElement).toBe(false);
  expect(anchor instanceof other.window.HTMLElement).toBe(true);

  expect(isSvgElement(anchor)).toBe(false);
});
