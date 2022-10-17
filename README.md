# About the "use-gsap-scrollsmoother" branch

This branch has the same API and methods as the main branch, but its internals are refactored to use [GSAP ScrollSmoother](https://greensock.com/docs/v3/Plugins/ScrollSmoother), a paid plugin of GSAP included in [Shockingly Green Memberships](https://greensock.com/club/#feature-list) and up.  

Your project must have `gsap` installed, and GSAP must include the "ScrollSmoother" bonus plugin!  This package doesn't include this, and will fail without it.  This was on purpose, because I didn't want to put the paid plugins in a public repo.

The best way I found to install GSAP is to go to the [install page](https://greensock.com/docs/v3/Installation) and follow the section titled "NPM / Build Tools". TLDR: download the zip file, copy the tgz into your repo, and run `yarn add ./gsap-bonus.tgz`.

More details:

- Added  `verticalOffset` property to options.  Might be nice to add options to configure how fast it scrolls too.
# nuxt-page-transition-and-anchor-handler

This package add animated scrolling to all anchor links using [scrollTo](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTo).  It also adds a default cross-dissolve page transition which feels faster than the normal Nuxt `out-in` transition.  This works best when you do the second step of **Install**, making the page scroll to top before the transition starts.

## Install

1. `yarn add nuxt-page-transition-and-anchor-handler` or `npm install nuxt-page-transition-and-anchor-handler`
2. Add `nuxt-page-transition-and-anchor-handler` to your `modules` array

If you need to support browsers that don't support [`ScrollToOptions`](https://caniuse.com/mdn-api_scrolltooptions) give [`smoothscroll-polyfill`](https://github.com/iamdustan/smoothscroll) a shot.

## Options

Can be set with the module or in the config file under the `ptah` key.

- `css` (`true`) - Include the default transition styles (see `transition.css`)
- `scrollToTopBeforePageChange` (`true`) - Whether to explicitly and smoothly scroll to top before the page change transition.
- `initialDelay` (`500`) - How long to wait after the `window.onNuxtReady` event before handling the initial page anchor.  This gives the page a chance to render the elements you are trying to scroll to.
- `afterPageChangeDelay` (`0`) - How long to wait after a page changing event before handling the page anchor.
- `anchorSelector` (`[data-anchor={{anchor}}]`) - The selector to scroll to. `{{anchor}}` will be replaced with the URL hash (minus the '#').
- `transition` (see source code) - The Nuxt [transition](https://nuxtjs.org/api/configuration-transition) object

## Methods

These methods are injected globally:

- `this.$scrollTo(target)` - Target can be a number or a DOM element
- `this.$scrollToTop()` - Shorthand for this.$scrollTo(0)
- `this.$scrollComplete()` - Returns a Promise that resolves when the current scroll finishes
- `this.$setVerticalOffset()` - Set the vertical offset. You might use this when the header height changes responsively.
