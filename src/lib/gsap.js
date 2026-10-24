import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Centralized GSAP setup — registered once here so any component can import
// `gsap`/`ScrollTrigger` from this file without re-registering the plugin.
gsap.registerPlugin(ScrollTrigger);

// Phones: don't recalculate every ScrollTrigger when the browser address bar
// slides in/out (that resize event is what makes mobile animations jump).
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger };