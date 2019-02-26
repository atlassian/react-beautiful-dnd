// flow-typed signature: d87955256c0438e8d919bd2cfe5423e9
// flow-typed version: 028ef45280/@storybook/addon-options_v4.x.x/flow_>=v0.25.x

declare module '@storybook/addon-options' {
  declare type Theme = {
    /**
     * applied to root `background`
     * @default: 'linear-gradient(to bottom right, black, gray'
     */
    mainBackground?: string,
    /**
     * applied to panels `border`
     * @default: '1px solid rgba(0,0,0,0.1)'
     */
    mainBorder?: string,
    /**
     * applied for most borders
     * @default: 'rgba(0,0,0,0.1)'
     */
    mainBorderColor?: string,
    /**
     * applied to panels, buttons, inputs
     * @default: 4
     */
    mainBorderRadius?: string,
    /**
     * applied to panels `background`
     * @default: 'rgba(255,255,255,0.89)'
     */
    mainFill?: string,
    /**
     * applied to TabsBar `background`
     * @default: 'rgba(255,255,255,1)'
     */
    barFill?: string,
    /**
     * applied to Input `background`
     * @default: 'rgba(0,0,0,0.05)'
     */
    inputFill?: string,
    /**
     * applied to root `font-family`
     */
    mainTextFace?: string,
    /**
     * applied to root & buttons & input `color`
     * @default: black
     */
    mainTextColor?: string,
    /**
     * applied to root
     * @default: 13
     */
    mainTextSize?: string,
    /**
     * applied in less important text
     * @default: 'rgba(0,0,0,0.4)'
     */
    dimmedTextColor?: string,
    /**
     * applied to indicate selection
     * @default: '#9fdaff'
     */
    highlightColor?: string,
    /**
     * applied to indicate positive
     * @default: '#0edf62'
     */
    successColor?: string,
    /**
     * applied to indicate negative
     * @default: '#ff3f3f'
     */
    failColor?: string,
    /**
     * applied to indicate ow-ow
     * @default: 'orange'
     */
    warnColor?: string,
    /**
     * applied to pre,
     */
    monoTextFace?: string,
    /**
     * applied to space panels
     * @default: 10
     */
    layoutMargin?: string,
    /**
     * applied to overlay `background`
     * @default: 'linear-gradient(to bottom right, rgba(233, 233, 233, 0.6), rgba(255, 255, 255, 0.8))'
     */
    overlayBackground?: string,
  };

  declare type Options = {
    theme?: Theme,
    /**
     * name to display in the top left corner
     */
    name?: string,
    /**
     * URL for name in top left corner to link to
     */
    url?: string,
    /**
     * show story component as full screen
     */
    goFullScreen?: boolean,
    /**
     * display panel that shows a list of stories
     */
    showStoriesPanel?: boolean,
    /**
     * display panel that shows addon configurations
     */
    showAddonPanel?: boolean,
    /**
     * display floating search box to search through stories
     */
    showSearchBox?: boolean,
    /**
     * show addon panel as a vertical panel on the right
     */
    addonPanelInRight?: boolean,
    /**
     * sorts stories
     */
    sortStoriesByKind?: boolean,
    /**
     * regex for finding the hierarchy separator
     * @example:
     *   null - turn off hierarchy
     *   /\// - split by `/`
     *   /\./ - split by `.`
     *   /\/|\./ - split by `/` or `.`
     */
    hierarchySeparator?: RegExp | string,
    /**
     * regex for finding the hierarchy root separator
     * @example:
     *   null - turn off multiple hierarchy roots
     *   /\|/ - split by `|`
     */
    hierarchyRootSeparator?: RegExp | string,
    /**
     * sidebar tree animations
     */
    sidebarAnimations?: boolean,
    /**
     * id to select an addon panel
     * The order of addons in the "Addon panel" is the same as you import them in 'addons.js'.
     * The first panel will be opened by default as you run Storybook
     */
    selectedAddonPanel?: string,
    /**
     * enable/disable shortcuts
     * @default true
     */
    enableShortcuts?: boolean,
  };

  declare function setOptions(options: $Exact<Options>): void; // deprecated: use `withOptions`
  declare function withOptions(options: $Exact<Options>): void;
}
