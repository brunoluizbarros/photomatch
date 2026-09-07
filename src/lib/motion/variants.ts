import type { Variants } from 'motion/react';

// Container: staggerChildren decide o ritmo da cascata; quem usa decide o
// gatilho (animate=mount, whileInView=rolagem). fadeUp: a transição de cada
// filho. Compartilhado entre home-experience.tsx e organizer-home.tsx pra
// não duplicar o mesmo par de variants nos dois.
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};
