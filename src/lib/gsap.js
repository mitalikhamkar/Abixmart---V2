import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Centralized GSAP setup — registered once here so any component can import
// `gsap`/`ScrollTrigger` from this file without re-registering the plugin.
gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };