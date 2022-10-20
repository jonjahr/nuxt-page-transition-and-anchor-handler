import { gsap, ScrollTrigger, ScrollSmoother } from 'gsap/all'

// Get settings from the module
const options = JSON.parse('<%= options %>');

// Export the plugin config
export default function({ app, store }, inject) {

	// Make the VueX module
	const vuexModule = {
		namespaced: true,
		state: {
			scrolling: process.client ? Promise.resolve() : null,
			isScrolling: false,
			isTransitioning: false,
		},
		mutations: {

			// Track scrolling
			startScroll: function(state, promise) {
				state.scrolling = promise;
				state.isScrolling = true
			},

			// Mark the scroll stopped
			stopScroll: function(state) {
				state.isScrolling = false
			},

			// Track transitioning
			transitioning: function(state, bool) {
				state.isTransitioning = bool
			},
		}
	}

	// Add our VueX module to the store.  I tried to make a seperate file but
	// something gets confused in the Nuxt module. It seems to want to preserve
	// state by default, so I'm explicitly disabling this so state doesn't end
	// up undefined when running in SSR
	store.registerModule('ptah', vuexModule, {
		preserveState: false
	})

	// Scroll to an element or value
	function scrollTo (target, {immediate}={}) {

		// Start scrolling
		store.commit('ptah/startScroll', executeScroll(target, {immediate})

		// Update the scolling boolean after it's done
		.then(function() {
			store.commit('ptah/stopScroll')
		}))
	}

	// Do scrolling and wait for scroll to complete.
	function executeScroll(target, {immediate}={}) {

		// Get GSAP ScrollSmoother instance
		const scroller = ScrollSmoother.get()

		// If scrolling is disabled, immediately resolve
		if (scroller.paused()) {
			return Promise.resolve()
		}

		// Get target's vertical offset and the distance we have to scroll
		const targetOffset = target instanceof Element ?
			// If target is an element, calculate its offset when the top of the element
			// reaches `verticalOffset` pixels from the top of the viewport.
			scroller.offset(target, `top ${options.verticalOffset}px`) :
			// Use the raw passed-in offset value
			parseInt(target)
		const scrollDistance = Math.abs( targetOffset - scroller.scrollTop() )

		// Calculate scroll time. Use a base time of 0.5 sec plus
		// a combination of scrollDistance and our scroller config value.
		const scrollDurationSec = 0.5 + scroller.smooth() * scrollDistance / 5000

		// If already at target, immediately resolve
		if (scrollDistance == 0) {
			return Promise.resolve()
		}

		// Make promise
		return new Promise(resolve => {
			// Start scrolling
			gsap.to(scroller, {
				scrollTop: Math.min(ScrollTrigger.maxScroll(window), targetOffset),
				duration: immediate==true ? 0 : scrollDurationSec,
				ease: 'expo.inOut',
				onComplete: resolve
			})
		})
	}

	// Scroll to the current anchor on the page
	function scrollToHash() {

		// Require a hash
		if (!app.router.currentRoute.hash) return
		const anchor = app.router.currentRoute.hash.substring(1)

		// Check for element on the page to match the hash
		const selector = options.anchorSelector.replace('{{anchor}}', anchor)
		const el = document.querySelector(selector)
		if (!el) return

		// Scroll to the anchor
		scrollTo(el)
	}

	// React to route changes when only the hash changes.  Other page changes are
	// handled by the global layout transition.
	app.router.afterEach(function (to, from) {
		if (to.path === from.path && to.hash !== from.hash) {
			scrollToHash();
		}
	})

	// Listen for the initial page build and then wait a bit for it to finish
	// rendering.
	window.onNuxtReady(function() {
		return setTimeout(scrollToHash, options.initialDelay);
	})

	// Inject helpers
	inject('scrollTo', scrollTo)
	inject('scrollToTop', function () {
		scrollTo(0)
	})

	// Syntactic sugar for getting the scrolling boolean
	inject('scrollComplete', function () {
		return store.state.ptah.scrolling;
	})

	// Handle beforeLeave transition events (e.g. the transition has started)
	inject('beforePageLeave', function() {
		this.$store.commit('ptah/transitioning', true)
	})

	// Handle afterEnter transition events (e.g. the transition is done),
	// scrolling if there is a relevant hash after waiting a tick (at minimum).
	inject('afterPageEnter', function() {
		this.$store.commit('ptah/transitioning', false)
		setTimeout(scrollToHash, options.afterPageChangeDelay)
	})

	// Set the vertical offset at runtime
	inject('setVerticalOffset', function(height) {
		options.verticalOffset = height
	})

	// Scroll to top when switching to page with a new path. This hook is fired
	// before asyncData. We're not scrolling to top on query param changes or
	// hash changes which are assumed to be the same page. When from.name is
	// undefined, this indicates the initial request and thus no need to scroll.
	// We're waiting a tick to do the scroll so that any other code that reacts
	// to act on beforEach, like clearing body scroll locks, has a chance to
	// execute first.
	if (options.scrollToTopBeforePageChange) {
		app.router.beforeEach((to, from, next) => {
			if (process.client && from.name && to.path != from.path) {
				setTimeout(() => { scrollTo(0) }, 0)
			}
			next()
		})
	} else {
		// Scroll to top immediately after navigation.  We must use scrollTo(), or else
		// the browser's default "scroll to top" behavior will cause ScrollSmoother to 
		// scroll us smoothly to the top.  We don't want smooth, we want immediate.
		app.router.afterEach((to, from, failure) => {
			if (process.client && from.name && to.path != from.path) {
				setTimeout(() => { scrollTo(0, {immediate: true}) }, 0)
			}
		})
	}

	// Wait until scrolling to top has finished. This hook is fired after
	// asyncData but before navigation happens. It needs to wait a tick so that
	// it doesn't fire before beforeEach when statically generated with preloaded
	// data.
	if (options.scrollToTopBeforePageChange) {
		app.router.beforeResolve((to, from, next) => {
			setTimeout(() => {
				if (process.client) store.state.ptah.scrolling.then(next)
				else next()
			}, 0)
		})
	}

}
