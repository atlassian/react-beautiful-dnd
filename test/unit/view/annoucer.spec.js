// @flow
import createAnnouncer from '../../../src/view/announcer/announcer';
import type { Announcer } from '../../../src/view/announcer/announcer-types';

describe('mounting', () => {
  it('should not create a dom node before mount is called', () => {
    const announcer: Announcer = createAnnouncer();

    const el: ?HTMLElement = document.getElementById(announcer.id);

    expect(el).not.toBeTruthy();
  });

  it('should create a new element when mounting', () => {
    const announcer: Announcer = createAnnouncer();

    announcer.mount();
    const el: ?HTMLElement = document.getElementById(announcer.id);

    expect(el).toBeInstanceOf(HTMLElement);
  });

  it('should throw if attempting to double mount', () => {
    const announcer: Announcer = createAnnouncer();

    announcer.mount();

    expect(() => announcer.mount()).toThrow();
  });

  it('should apply the appropriate aria attributes and non visibility styles', () => {
    const announcer: Announcer = createAnnouncer();

    announcer.mount();
    const el: HTMLElement = (document.getElementById(announcer.id): any);

    expect(el.getAttribute('aria-live')).toBe('assertive');
    expect(el.getAttribute('role')).toBe('log');
    expect(el.getAttribute('aria-atomic')).toBe('true');

    // not checking all the styles - just enough to know we are doing something
    expect(el.style.overflow).toBe('hidden');
  });
});

describe('unmounting', () => {
  it('should remove the element when unmounting', () => {
    const announcer: Announcer = createAnnouncer();

    announcer.mount();
    announcer.unmount();
    const el: ?HTMLElement = document.getElementById(announcer.id);

    expect(el).not.toBeTruthy();
  });

  it('should throw if attempting to unmount before mounting', () => {
    const announcer: Announcer = createAnnouncer();

    expect(() => announcer.unmount()).toThrow();
  });

  it('should throw if unmounting after an unmount', () => {
    const announcer: Announcer = createAnnouncer();

    announcer.mount();
    announcer.unmount();

    expect(() => announcer.unmount()).toThrow();
  });
});

describe('announcing', () => {
  it('should throw if not mounted', () => {
    const announcer: Announcer = createAnnouncer();

    expect(() => announcer.announce('test')).toThrow();
  });

  it('should set the text content of the announcement element', () => {
    const announcer: Announcer = createAnnouncer();
    announcer.mount();
    const el: HTMLElement = (document.getElementById(announcer.id): any);

    announcer.announce('test');

    expect(el.textContent).toBe('test');
  });
});
