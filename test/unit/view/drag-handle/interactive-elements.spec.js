// @flow
import type { ReactWrapper } from 'enzyme';
import { forEach, type Control } from './util/controls';
import {
  getStubCallbacks,
  callbacksCalled,
  resetCallbacks,
} from './util/callbacks';
import { getWrapper } from './util/wrappers';
import { interactiveTagNames } from '../../../../src/view/drag-handle/util/should-allow-dragging-from-target';
import type { Callbacks } from '../../../../src/view/drag-handle/drag-handle-types';
import type { TagNameMap } from '../../../../src/view/drag-handle/util/should-allow-dragging-from-target';

const mixedCase = (map: TagNameMap): string[] => [
  ...Object.keys(map).map((tagName: string) => tagName.toLowerCase()),
  ...Object.keys(map).map((tagName: string) => tagName.toUpperCase()),
];

forEach((control: Control) => {
  let wrapper: ReactWrapper;
  let callbacks: Callbacks;

  beforeEach(() => {
    callbacks = getStubCallbacks();
    wrapper = getWrapper(callbacks);
  });

  describe('interactive elements', () => {
    it('should not start a drag if the target is an interactive element', () => {
      mixedCase(interactiveTagNames).forEach((tagName: string) => {
        const element: HTMLElement = document.createElement(tagName);
        const options = {
          target: element,
        };

        control.preLift(wrapper, options);
        control.lift(wrapper, options);

        expect(
          callbacksCalled(callbacks)({
            onLift: 0,
          }),
        ).toBe(true);
      });
    });

    it('should start a drag on an interactive element if asked to by user', () => {
      // allowing dragging from interactive elements
      wrapper.setProps({ canDragInteractiveElements: true });

      mixedCase(interactiveTagNames).forEach(
        (tagName: string, index: number) => {
          const element: HTMLElement = document.createElement(tagName);
          const options = {
            target: element,
          };

          control.preLift(wrapper, options);
          control.lift(wrapper, options);
          control.drop(wrapper);

          expect(
            callbacksCalled(callbacks)({
              onLift: index + 1,
              onDrop: index + 1,
            }),
          ).toBe(true);
        },
      );
    });

    it('should start a drag if the target is not an interactive element', () => {
      const nonInteractiveTagNames: TagNameMap = {
        a: true,
        div: true,
        span: true,
        header: true,
      };

      // counting call count between loops
      let count: number = 0;

      [true, false].forEach((bool: boolean) => {
        // doesn't matter if this is set or not
        wrapper.setProps({ canDragInteractiveElements: bool });

        mixedCase(nonInteractiveTagNames).forEach((tagName: string) => {
          count++;
          const element: HTMLElement = document.createElement(tagName);
          const options = {
            target: element,
          };

          control.preLift(wrapper, options);
          control.lift(wrapper, options);
          control.drop(wrapper);

          expect(
            callbacksCalled(callbacks)({
              onLift: count,
              onDrop: count,
            }),
          ).toBe(true);
        });
      });
    });
  });

  describe('interactive parents', () => {
    it('should not start a drag if the parent is an interactive element', () => {
      mixedCase(interactiveTagNames).forEach((tagName: string) => {
        const parent: HTMLElement = document.createElement(tagName);
        const child: HTMLElement = document.createElement('span');
        parent.appendChild(child);
        const options = {
          target: child,
        };

        control.preLift(wrapper, options);
        control.lift(wrapper, options);
        control.drop(wrapper);

        expect(
          callbacksCalled(callbacks)({
            onLift: 0,
          }),
        ).toBe(true);
      });
    });

    it('should not start a drag if the parent is interactive and the child is an SVG', () => {
      // $ExpectError - flow does not know about SVGElement yet
      const svg: SVGElement = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
      );
      expect(svg instanceof SVGElement).toBe(true);

      mixedCase(interactiveTagNames).forEach((tagName: string) => {
        const parent: HTMLElement = document.createElement(tagName);
        parent.appendChild(svg);
        const options = {
          target: svg,
        };

        control.preLift(wrapper, options);
        control.lift(wrapper, options);
        control.drop(wrapper);

        expect(
          callbacksCalled(callbacks)({
            onLift: 0,
          }),
        ).toBe(true);
      });
    });

    it('should start a drag on a Element with an interactive parent if asked to by user', () => {
      // allowing dragging from interactive elements
      wrapper.setProps({ canDragInteractiveElements: true });

      // $ExpectError - flow does not know about SVGElement yet
      const svg: SVGElement = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
      );
      expect(svg instanceof SVGElement).toBe(true);

      const div: HTMLElement = document.createElement('div');
      expect(div instanceof HTMLElement).toBe(true);

      [div, svg].forEach((child: Element) => {
        mixedCase(interactiveTagNames).forEach((tagName: string) => {
          const parent: HTMLElement = document.createElement(tagName);
          parent.appendChild(child);
          const options = {
            target: child,
          };

          expect(
            callbacksCalled(callbacks)({
              onLift: 0,
              onDrop: 0,
            }),
          ).toBe(true);

          control.preLift(wrapper, options);
          control.lift(wrapper, options);
          control.drop(wrapper);

          expect(
            callbacksCalled(callbacks)({
              onLift: 1,
              onDrop: 1,
            }),
          ).toBe(true);

          // cleanup
          resetCallbacks(callbacks);
          parent.removeChild(child);
        });
      });
    });

    it('should start a drag if the target has no interactive parents', () => {
      const nonInteractiveTagNames: TagNameMap = {
        a: true,
        div: true,
        span: true,
        header: true,
      };

      // counting call count between loops
      let count: number = 0;

      [true, false].forEach((bool: boolean) => {
        // doesn't matter if this is set or not
        wrapper.setProps({ canDragInteractiveElements: bool });

        mixedCase(nonInteractiveTagNames).forEach((tagName: string) => {
          count++;
          const parent: HTMLElement = document.createElement(tagName);
          const child: HTMLElement = document.createElement('span');
          parent.appendChild(child);
          const options = {
            target: child,
          };

          control.preLift(wrapper, options);
          control.lift(wrapper, options);
          control.drop(wrapper);

          expect(
            callbacksCalled(callbacks)({
              onLift: count,
              onDrop: count,
            }),
          ).toBe(true);
        });
      });
    });
  });
});
