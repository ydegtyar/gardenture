/**
 * @file GameButton.tsx
 * Reusable AAA fantasy botanical action button shared across the Main Menu and Draft Modal.
 *
 * Usage:
 * | Prop | Values | Default | Description |
 * | --- | --- | --- | --- |
 * | `variant` | `'green' \| 'gold' \| 'teal' \| 'dark' \| 'danger'` | `'gold'` | Button material & color recipe |
 * | `size` | `'md' \| 'lg'` | `'md'` | Touch height (`md` >= 52px, `lg` >= 62px) |
 * | `ornament` | `'ivy' \| 'thorn' \| 'laurel' \| 'crystal' \| 'none'` | `'none'` | Botanical border overlay |
 * | `title` | `string` | required | Primary button heading |
 * | `subtitle` | `string` | optional | Secondary status/counter line |
 * | `badge` | `React.ReactNode` | optional | Right-side pill chip (cost, count, reward) |
 */

import React from 'react';
import {
  CrystalCornerOrnamentSvg,
  IvyButtonOrnamentSvg,
  LaurelButtonOrnamentSvg,
  ThornButtonOrnamentSvg,
} from './ornateAssets';

export type GameButtonVariant = 'green' | 'gold' | 'teal' | 'dark' | 'danger';
export type GameButtonSize = 'md' | 'lg';
export type GameButtonOrnament = 'ivy' | 'thorn' | 'laurel' | 'crystal' | 'none';

export interface GameButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  variant?: GameButtonVariant;
  size?: GameButtonSize;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  badgeTestId?: string;
  ornament?: GameButtonOrnament;
  disabled?: boolean;
  loading?: boolean;
  onPressSound?: () => void;
  align?: 'center' | 'between';
  dataTestId?: string;
  dataStart?: boolean;
}

const VARIANT_STYLES: Readonly<
  Record<
    GameButtonVariant,
    {
      shell: string;
      innerBevel: string;
      titleColor: string;
      subtitleColor: string;
      iconWell: string;
    }
  >
> = {
  green: {
    shell:
      'bg-gradient-to-b from-[#6ee7a8] via-[#31ad6b] to-[#196b40] hover:from-[#86f2ba] hover:via-[#39bf78] hover:to-[#1f7d4b] border-2 border-[#bbf7d0] shadow-[0_12px_24px_rgba(5,2,10,0.82),0_4px_10px_rgba(0,0,0,0.72),0_0_22px_rgba(52,211,153,0.34)]',
    innerBevel: 'border-[#0c361f]/65',
    titleColor: 'text-[#0a2214]',
    subtitleColor: 'text-[#0a2214]/85',
    iconWell: 'bg-[#0a2214]/18 border-[#0a2214]/28 text-[#0a2214]',
  },
  gold: {
    shell:
      'bg-gradient-to-b from-[#fff1b0] via-[#e8b84e] to-[#b57a1e] hover:from-[#fff6c7] hover:via-[#f0c45d] hover:to-[#c48726] border-2 border-[#fff7cf] shadow-[0_12px_26px_rgba(5,2,10,0.84),0_4px_10px_rgba(0,0,0,0.75),0_0_24px_rgba(232,184,78,0.4)]',
    innerBevel: 'border-[#6b440e]/65',
    titleColor: 'text-[#241809]',
    subtitleColor: 'text-[#241809]/85',
    iconWell: 'bg-[#241809]/15 border-[#241809]/25 text-[#241809]',
  },
  teal: {
    shell:
      'bg-gradient-to-b from-[#1f443d] via-[#15302b] to-[#0d201d] hover:from-[#265249] hover:via-[#1b3c36] hover:to-[#112925] border-2 border-[#dfc174] shadow-[0_12px_24px_rgba(5,2,10,0.84),0_4px_10px_rgba(0,0,0,0.75),0_0_18px_rgba(92,214,192,0.24)]',
    innerBevel: 'border-[#8f691c]/55',
    titleColor: 'text-[#fdf8eb]',
    subtitleColor: 'text-[#86efac]',
    iconWell: 'bg-[#6ee7b7]/15 border-[#e8b84e]/45 text-[#86efac]',
  },
  dark: {
    shell:
      'bg-gradient-to-b from-[#312339]/95 via-[#24192b]/96 to-[#1c1322]/95 hover:from-[#3d2b47]/98 hover:to-[#281b30]/98 border border-[#8c7899]/70 shadow-[0_12px_24px_rgba(5,2,10,0.82),0_4px_10px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.16)]',
    innerBevel: 'border-[#ffffff]/10',
    titleColor: 'text-[#f8f5ef]',
    subtitleColor: 'text-[#d8cfc2]',
    iconWell: 'bg-[#ffffff]/10 border-[#ffffff]/20 text-[#e5dec9]',
  },
  danger: {
    shell:
      'bg-gradient-to-b from-[#541d28] via-[#3a121b] to-[#260b11] hover:from-[#692432] hover:to-[#361019] border-2 border-[#e06d83] shadow-[0_12px_24px_rgba(5,2,10,0.84),0_0_18px_rgba(201,74,97,0.34)]',
    innerBevel: 'border-[#24070c]/70',
    titleColor: 'text-[#fdf8eb]',
    subtitleColor: 'text-[#fecdd3]',
    iconWell: 'bg-[#000000]/25 border-[#fecdd3]/30 text-[#fecdd3]',
  },
};

export const GameButton: React.FC<GameButtonProps> = ({
  variant = 'gold',
  size = 'md',
  icon,
  title,
  subtitle,
  badge,
  badgeTestId,
  ornament = 'none',
  disabled = false,
  loading = false,
  onClick,
  onPressSound,
  align,
  className = '',
  dataTestId,
  dataStart,
  'aria-label': ariaLabelProp,
  ...rest
}) => {
  const isDisabled = disabled || loading;
  const v = VARIANT_STYLES[variant] ?? VARIANT_STYLES.gold;
  const resolvedAlign = align ?? (badge || subtitle ? 'between' : 'center');

  const sizeClasses =
    size === 'lg'
      ? 'min-h-[60px] sm:min-h-[66px] px-5 sm:px-6 py-2.5 rounded-[14px]'
      : 'min-h-[50px] sm:min-h-[54px] px-3.5 sm:px-4 py-2 rounded-[13px]';

  const computedAriaLabel =
    ariaLabelProp ??
    [
      loading ? 'Loading' : title,
      subtitle,
      typeof badge === 'string' || typeof badge === 'number' ? String(badge) : undefined,
    ]
      .filter(Boolean)
      .join(' — ');

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return;
    onPressSound?.();
    onClick?.(e);
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-label={computedAriaLabel}
      data-testid={dataTestId}
      data-start={dataStart ? 'true' : undefined}
      data-variant={variant}
      data-ornament={ornament}
      onClick={handleClick}
      className={`group relative inline-flex items-center ${
        resolvedAlign === 'between' ? 'justify-between text-left' : 'justify-center text-center'
      } gap-2.5 sm:gap-3 select-none touch-manipulation transition-all duration-150 ${sizeClasses} ${
        v.shell
      } ${
        isDisabled
          ? 'opacity-45 grayscale-[35%] cursor-not-allowed shadow-none'
          : 'cursor-pointer hover:-translate-y-[1.5px] active:translate-y-[1px] active:scale-[0.975]'
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fe0c8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#120b18] ${className}`}
      {...rest}
    >
      {/* Top specular gloss highlight */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-2 top-[2px] h-[38%] rounded-t-[10px] bg-gradient-to-b from-white/30 to-transparent"
      />

      {/* Inner metallic bevel frame */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-[3px] rounded-[10px] border ${v.innerBevel}`}
      />

      {/* Botanical / Crystal Ornament Overlays */}
      {ornament === 'ivy' && <IvyButtonOrnamentSvg />}
      {ornament === 'thorn' && <ThornButtonOrnamentSvg />}
      {ornament === 'laurel' && <LaurelButtonOrnamentSvg />}
      {ornament === 'crystal' && <CrystalCornerOrnamentSvg />}

      {/* Content Row */}
      {resolvedAlign === 'center' && !subtitle && !badge ? (
        <span className="relative z-10 inline-flex items-center justify-center gap-2.5 min-w-0">
          {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
          <span
            className={`${
              size === 'lg' && variant === 'gold'
                ? 'font-display text-xl sm:text-[23px] font-extrabold tracking-wide'
                : size === 'lg'
                  ? 'font-sans text-sm sm:text-[16px] font-bold whitespace-nowrap'
                  : 'font-sans text-sm sm:text-[15px] font-semibold'
            } ${v.titleColor}`}
          >
            {loading ? 'Loading...' : title}
          </span>
        </span>
      ) : (
        <>
          <div className="relative z-10 flex items-center gap-2.5 min-w-0">
            {icon && (
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center shrink-0 shadow-inner ${v.iconWell}`}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0 flex flex-col justify-center">
              <div
                className={`text-xs sm:text-sm font-display font-extrabold leading-tight whitespace-nowrap ${v.titleColor}`}
              >
                {loading ? 'Loading Ad...' : title}
              </div>
              {subtitle && (
                <div
                  className={`text-[10px] sm:text-[11px] font-bold font-mono-tabular leading-tight whitespace-nowrap mt-0.5 ${v.subtitleColor}`}
                >
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          {badge !== undefined && badge !== null && (
            <span
              data-testid={badgeTestId}
              className="relative z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#120d16]/90 border border-[#e8b84e]/55 text-[#fff4b8] font-mono-tabular text-[11px] font-extrabold tracking-wider whitespace-nowrap shrink-0 shadow-inner"
            >
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  );
};

export default GameButton;
