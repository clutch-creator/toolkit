/**
 * This file contains the main style selectors used by the Clutch UI and primitives.
 * Every shared selector is defined here to ensure consistency across components, but
 * they are copied to each instance on use and can be overridden by the user.
 *
 * NOTE: As they are copied to each instance, they have no versioning and need to be
 * manually updated if the base selector changes.
 */

export type TStyleSelector = {
  name: string;
  value: string;
};

const asStyleSelectorsDict = <K extends PropertyKey>(o: {
  [P in K]: TStyleSelector;
}) => o;

export const StyleSelectors = asStyleSelectorsDict({
  AUTOPLAY: { name: 'autoplay', value: '&[data-autoplay]' },
  BUFFERING: { name: 'buffering', value: '&[data-buffering]' },
  CHECKED: { name: 'checked', value: '&:checked, &[data-checked]' },
  CURRENT: { name: 'current', value: '&[data-current]' },
  DISABLED: { name: 'disabled', value: '&[disabled], &[data-disabled]' },
  DRAGGING: { name: 'dragging', value: '&[data-dragging]' },
  EMPTY: { name: 'empty', value: '&:empty, &[data-empty]' },
  ENABLED: { name: 'enabled', value: '&:enabled, &[data-enabled]' },
  ENDED: { name: 'ended', value: '&[data-ended]' },
  EVEN: { name: 'even', value: '&:nth-child(even), &[data-even]' },
  EXPANDED: {
    name: 'expanded',
    value: '&[aria-expanded=true], &[data-expanded]',
  },
  FIRST_CHILD: {
    name: 'first child',
    value: '&:first-child, &[data-first-child]',
  },
  FOCUSED: { name: 'focused', value: '&:focus, &[data-focused]' },
  FOCUS_VISIBLE: {
    name: 'focus-visible',
    value: '&:focus-visible, &[data-focus-visible]',
  },
  FOCUS_WITHIN: {
    name: 'focus-within',
    value: '&:focus-within, &[data-focus-within]',
  },
  FULLSCREEN: { name: 'fullscreen', value: ':fullscreen, &[data-fullscreen]' },
  HORIZONTAL: { name: 'horizontal', value: '&[data-orientation=horizontal]' },
  HOVERED: { name: 'hovered', value: '&:hover, &[data-hovered]' },
  INDETERMINATE: {
    name: 'indeterminate',
    value: '&:indeterminate, &[data-indeterminate]',
  },
  INVALID: { name: 'invalid', value: '&:invalid, &[data-invalid]' },
  LAST_CHILD: { name: 'last child', value: '&:last-child, &[data-last-child]' },
  LINK: { name: 'link', value: '&:link, &[data-link]' },
  LOADED: { name: 'loaded', value: '&[data-loaded]' },
  LOADING: { name: 'loading', value: '&[data-loading]' },
  MUTED: { name: 'muted', value: ':muted, &[data-muted]' },
  ODD: { name: 'odd', value: '&:nth-child(odd), &[data-odd]' },
  ONLY_CHILD: { name: 'only-child', value: '&:only-child, &[data-only-child]' },
  OPEN: { name: 'open', value: '&[data-open]' },
  PAUSED: { name: 'paused', value: '&:paused, &[data-paused]' },
  PLACEHOLDER: {
    name: 'placeholder',
    value: '&::placeholder, &[data-placeholder]',
  },
  PLACEHOLDER_VISIBLE: {
    name: 'placeholder visible',
    value: '&::placeholder-shown, &[data-placeholder-shown]',
  },
  PLAYING: { name: 'playing', value: '&:playing, &[data-playing]' },
  PRESSED: {
    name: 'pressed',
    value: '&[aria-pressed=true], &[data-pressed], &:active, &[data-active]',
  },
  READONLY: { name: 'readonly', value: '&:read-only, &[data-readonly]' },
  REQUIRED: { name: 'required', value: '&:required, &[data-required]' },
  SEEKING: { name: 'seeking', value: '&[data-seeking]' },
  SELECTED: {
    name: 'selected',
    value: '&[aria-selected=true], &[data-selected]',
  },
  TARGET: { name: 'target', value: '&:target, &[data-target]' },
  VALID: { name: 'valid', value: '&:valid, &[data-valid]' },
  VERTICAL: { name: 'vertical', value: '&[data-orientation=vertical]' },
  VISITED: { name: 'visited', value: '&:visited, &[data-visited]' },
});
