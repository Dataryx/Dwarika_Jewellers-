/** Admin UI accent — violet (replaces amber/orange across admin panel) */
export const ADMIN_ACCENT = {
  hex: '#8b5cf6',
  /** Primary button / solid fills */
  btn: 'bg-violet-500 hover:bg-violet-400 text-white',
  btnDarkText: 'bg-violet-500 hover:bg-violet-400 text-gray-950',
  /** Text & icons */
  text: 'text-violet-500',
  textHover: 'hover:text-violet-400',
  textMuted: 'text-violet-400',
  /** Focus rings & borders */
  focus: 'focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20',
  /** Soft backgrounds */
  soft: 'bg-violet-500/10',
  softBorder: 'border-violet-500/20',
  softActive: 'bg-violet-500/10 text-violet-500 border-violet-500/30',
} as const;
