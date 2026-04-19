const PREMIUM_EASE = [0.22, 1, 0.36, 1]
const CINEMATIC_EASE = [0.16, 1, 0.3, 1]

export const ease = {
  premium: PREMIUM_EASE,
  cinematic: CINEMATIC_EASE,
}

export const viewportOnce = { once: true, amount: 0.15, margin: '0px 0px -10% 0px' }
export const viewportLoose = { once: true, amount: 0.1, margin: '0px 0px -5% 0px' }

export const fadeRise = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: PREMIUM_EASE },
  },
}

export const fadeRiseSmall = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: PREMIUM_EASE },
  },
}

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: PREMIUM_EASE } },
}

export const fadeScale = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: PREMIUM_EASE },
  },
}

export const sectionGroup = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
}

export const listGroup = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.03,
    },
  },
}

export const cardItem = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: PREMIUM_EASE },
  },
}

export const sectionReveal = {
  initial: 'hidden',
  whileInView: 'show',
  viewport: viewportOnce,
  variants: fadeRise,
}

export const sectionStagger = {
  initial: 'hidden',
  whileInView: 'show',
  viewport: viewportOnce,
  variants: sectionGroup,
}

export const pageEnter = {
  initial: { opacity: 0, y: -24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: CINEMATIC_EASE },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.25, ease: PREMIUM_EASE },
  },
}
