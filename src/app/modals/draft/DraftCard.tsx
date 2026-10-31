/**
 * @file DraftCard.tsx
 * Botanical Tarot Card choice component for level-up drafts.
 * Uses StoreItemCard's RPG container frame, inner bevel hairline, and corner filigrees in a botanical emerald tone.
 * Features 3D flip reveal (`revealing`, `ready`, `flippingBack`, `swapping`, `resolving`),
 * edge-to-edge full-card back ornament on init and flip, unshaded card art on desktop,
 * and stable, optimized GPU hover transitions with zero jitter/shaking.
 */

import React, { useState } from 'react';
import type { DraftOfferItem } from '../../../sim/systems/cardDraft';
import { getTarotMetadata, TarotCardBackSvg, TarotIllustrationSvg } from '../../cards';
import {
  RARITY_GEM_COLORS,
  RarityGemSvg,
  type OrnateRarity,
} from '../../../ui/ornate';
import { TrinketCornerFiligreeSvg } from '../../trinkets';
import { cn } from '../../../utils/cn';
import { DRAFT_TIMINGS, type DraftSequencePhase } from './useDraftSequence';

export interface DraftCardProps {
  offer: DraftOfferItem;
  index: number;
  phase: DraftSequencePhase;
  rerollCount: number;
  isSelected: boolean;
  isAnySelected: boolean;
  canInteract: boolean;
  reducedMotion?: boolean;
  isMobile?: boolean;
  showHotkey?: boolean;
  onSelect: (offerId: string) => void;
  cardRef?: (el: HTMLButtonElement | null) => void;
}

const RARITY_CHIP_STYLES: Readonly<Record<OrnateRarity, string>> = {
  common: 'bg-[#1b2b22] text-[#d1fae5] border-[#2d6a4f]/70',
  uncommon: 'bg-[#133827] text-[#6ee7b7] border-[#10b981]/70',
  rare: 'bg-[#0f2d3d] text-[#7dd3fc] border-[#0ea5e9]/70',
  epic: 'bg-[#29173d] text-[#d8b4fe] border-[#a855f7]/70',
  legendary: 'bg-[#3b2707] text-[#fde047] border-[#f59e0b]/80',
};

export const DraftCard: React.FC<DraftCardProps> = ({
  offer,
  index,
  phase,
  rerollCount,
  isSelected,
  isAnySelected,
  canInteract,
  reducedMotion = false,
  isMobile = typeof window !== 'undefined' ? window.innerWidth <= 899 : false,
  showHotkey = true,
  onSelect,
  cardRef,
}) => {
  const tarotMeta = getTarotMetadata(offer.targetId);
  const rarity = (offer.rarity as OrnateRarity) || 'uncommon';
  const rarityChipClass = RARITY_CHIP_STYLES[rarity] ?? RARITY_CHIP_STYLES.uncommon;
  const rarityGemInfo = RARITY_GEM_COLORS[rarity] ?? RARITY_GEM_COLORS.uncommon;

  // Clean, stable hover state — zero cursor-relative oscillation or jitter
  const [isHovered, setIsHovered] = useState(false);

  // Track reveal transition from 180deg (face-down) -> 0deg (face-up)
  const [revealStarted, setRevealStarted] = useState(false);

  React.useEffect(() => {
    if (phase === 'revealing') {
      setRevealStarted(false);
      const raf = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          setRevealStarted(true);
        });
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf);
    } else if (phase === 'ready' || phase === 'resolving') {
      setRevealStarted(true);
    } else if (phase === 'flippingBack' || phase === 'swapping' || phase === 'idle') {
      setRevealStarted(false);
    }
  }, [phase, rerollCount]);

  const isFaceDown =
    phase === 'idle' ||
    phase === 'flippingBack' ||
    phase === 'swapping' ||
    (phase === 'revealing' && !revealStarted);

  const staggerMs = reducedMotion
    ? index * DRAFT_TIMINGS.REDUCED_STAGGER_MS
    : phase === 'flippingBack'
      ? index * DRAFT_TIMINGS.FLIP_BACK_STAGGER_MS
      : index * DRAFT_TIMINGS.REVEAL_STAGGER_MS;

  const durationMs = reducedMotion
    ? DRAFT_TIMINGS.REDUCED_FADE_MS
    : phase === 'flippingBack'
      ? DRAFT_TIMINGS.FLIP_BACK_DURATION_MS
      : DRAFT_TIMINGS.REVEAL_DURATION_MS;

  // Resolve selection scale/fade styling
  const resolvingClass =
    phase === 'resolving'
      ? isSelected
        ? 'scale-[1.04] z-30 brightness-110'
        : isAnySelected
          ? 'opacity-0 scale-95 pointer-events-none'
          : 'opacity-40 scale-98 pointer-events-none'
      : '';

  // Vertical 3D flip (rotateX) on mobile horizontal card layout, horizontal 3D flip (rotateY) on desktop column layout
  const flipTransform = reducedMotion
    ? 'none'
    : isFaceDown
      ? isMobile
        ? 'rotateX(180deg) scale(0.95)'
        : 'rotateY(180deg) scale(0.95)'
      : isHovered && canInteract && !isMobile
        ? 'translateY(-6px) scale(1.012)'
        : isMobile
          ? 'rotateX(0deg) scale(1)'
          : 'rotateY(0deg) scale(1)';

  return (
    <div
      className={`ornate-draft-perspective relative w-full h-full flex flex-col select-none transition-all duration-200 ${resolvingClass}`}
    >
      <div
        data-testid={`tarot-card-flip-wrapper-${index}`}
        data-flipping={phase === 'flippingBack' || phase === 'swapping' ? 'true' : 'false'}
        data-rerolled={rerollCount > 0 ? 'true' : 'false'}
        data-phase={phase}
        data-mobile={isMobile ? 'true' : 'false'}
        data-face-down={isFaceDown ? 'true' : 'false'}
        className="ornate-draft-flipper relative w-full h-full flex flex-col flex-1"
        style={{
          transitionProperty: 'transform, opacity',
          transitionDuration: phase === 'ready' ? '250ms' : `${durationMs}ms`,
          transitionTimingFunction: phase === 'ready' ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'var(--ornate-ease-out)',
          transitionDelay: phase === 'ready' ? '0ms' : `${staggerMs}ms`,
          transform: flipTransform,
          opacity: reducedMotion && isFaceDown ? 0 : 1,
        }}
      >
        {/* =================================================================
            FRONT FACE (StoreItemCards container with botanical emerald filigrees)
            ================================================================= */}
        <button
          ref={cardRef}
          type="button"
          data-testid={`tarot-card-offer-${index}`}
          disabled={!canInteract}
          onClick={() => {
            if (canInteract) {
              onSelect(offer.offerId);
            }
          }}
          onPointerEnter={() => {
            if (canInteract) setIsHovered(true);
          }}
          onPointerLeave={() => setIsHovered(false)}
          aria-label={`${tarotMeta.numeral} ${tarotMeta.arcanaTitle}: ${offer.title}, ${offer.subtitle}, Level ${offer.currentLevel} to ${offer.nextLevel}. ${offer.description}`}
          className={cn(
            'ornate-draft-face group relative w-full h-full flex-1 text-left rounded-[6px] p-2.5 sm:p-3 overflow-hidden border transition-all duration-250 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6ee7b7] flex flex-col justify-between',
            'bg-gradient-to-br from-[#13281e] via-[#0d1a14] to-[#070e0a]',
            isHovered || isSelected
              ? 'border-[#34d399] shadow-[0_16px_36px_rgba(0,0,0,0.9),0_0_20px_rgba(52,211,153,0.32),inset_0_1px_0_rgba(167,243,208,0.3)]'
              : 'border-[#1e5e3a] shadow-[0_12px_28px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(167,243,208,0.18)]',
            isSelected && 'ring-2 ring-[#6ee7b7] border-[#6ee7b7]',
            canInteract ? 'cursor-pointer' : 'cursor-default'
          )}
        >
          {/* Inner Bevel Hairline Frame */}
          <div
            className={cn(
              'absolute inset-[3px] rounded-[4px] border pointer-events-none z-10 transition-colors duration-250',
              isHovered || isSelected ? 'border-[#6ee7b7]/40' : 'border-[#34d399]/25'
            )}
          />

          {/* 4 Ornate Corner Filigree Flourishes in botanical emerald tone */}
          <TrinketCornerFiligreeSvg position="tl" variant="draft" active={isHovered || isSelected} />
          <TrinketCornerFiligreeSvg position="tr" variant="draft" active={isHovered || isSelected} />
          <TrinketCornerFiligreeSvg position="bl" variant="draft" active={isHovered || isSelected} />
          <TrinketCornerFiligreeSvg position="br" variant="draft" active={isHovered || isSelected} />

          {/* Atmospheric Glow Backdrop */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-250"
            style={{
              background: `radial-gradient(circle at 50% 32%, ${rarityGemInfo.mid}28 0%, transparent 72%)`,
              opacity: isHovered || isSelected ? 0.9 : 0.5,
            }}
          />

          {/* Midpoint Sparkle / Light Sweep Overlay on Reveal */}
          {!reducedMotion && (phase === 'revealing' || phase === 'ready') && (
            <span
              key={`sheen-${rerollCount}`}
              aria-hidden="true"
              style={{ animationDelay: `${staggerMs + 140}ms` }}
              className="ornate-card-sheen-active pointer-events-none absolute inset-y-0 left-0 z-20 w-1/2 bg-gradient-to-r from-transparent via-white/55 to-transparent"
            />
          )}

          {/* ===============================================================
              MOBILE LAYOUT (<= 899px): Horizontal Equal-Height Card
              =============================================================== */}
          <div className="ornate-card-mobile-grid relative z-10 w-full h-full">
            {/* Left Column (~26% width): Framed Illustrated Icon Art */}
            <div
              data-card-row="mobile-art"
              className="relative w-full h-full min-h-[86px] max-h-[124px] rounded-xl border border-[#2d6a4f] bg-gradient-to-b from-[#183325] via-[#10241a] to-[#0a1711] p-1 flex items-center justify-center overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.75)]"
            >
              <div className="w-full h-full flex items-center justify-center scale-[1.06] origin-center transition-transform duration-250 group-hover:scale-[1.12]">
                <TarotIllustrationSvg
                  targetId={offer.targetId}
                  rarity={offer.rarity}
                  iconColor={offer.iconColor}
                  className="w-full h-full object-contain block select-none"
                />
              </div>
              <span className="absolute top-1 left-1 z-10">
                <RarityGemSvg rarity={rarity} className="w-3 h-3" />
              </span>
            </div>

            {/* Right Column: Strict 5-Row Grid (Header -> Arcana -> Title -> Description -> Footer) */}
            <div className="ornate-card-mobile-right">
              {/* Row 1 (20px): Numeral (Left) + Rarity Chip (Right) */}
              <div
                data-card-row="mobile-header"
                className="flex items-center justify-between gap-1.5 whitespace-nowrap"
              >
                <span className="px-1.5 py-0.5 rounded bg-[#183324] border border-[#2d6a4f] text-[#fff1b0] font-display font-bold text-[10px] tracking-widest uppercase shrink-0 shadow-xs">
                  {tarotMeta.numeral}
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${rarityChipClass}`}
                >
                  <RarityGemSvg rarity={rarity} className="w-2 h-2 shrink-0" />
                  <span>{offer.subtitle}</span>
                </span>
              </div>

              {/* Row 2 (15px): Full Arcana Name on its own line (NEVER truncated) */}
              <div
                data-card-row="mobile-arcana"
                data-testid={`card-arcana-mobile-${index}`}
                className="font-extrabold uppercase tracking-wider text-[#86efac] leading-none whitespace-nowrap drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]"
                style={{ fontSize: 'clamp(9px, 2.35vw, 11px)' }}
              >
                {tarotMeta.arcanaTitle}
              </div>

              {/* Row 3 (20px): Card Title */}
              <h3
                data-card-row="mobile-title"
                className="text-sm sm:text-base font-display font-extrabold text-[#fff8e7] leading-tight line-clamp-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
              >
                {offer.title}
              </h3>

              {/* Row 4 (minmax(28px, 1fr)): Description */}
              <p
                data-card-row="mobile-description"
                className="text-[11px] sm:text-xs font-semibold text-[#d4dec9] leading-snug line-clamp-2 self-start"
              >
                {offer.description}
              </p>

              {/* Row 5 (24px): Divider + Synergy Tags (Left) + Level Badge (Right) */}
              <div
                data-card-row="mobile-footer"
                className="flex items-center justify-between gap-1.5 pt-1 border-t border-[#2d6a4f]/40 text-[10px] font-bold"
              >
                <div className="flex flex-wrap items-center gap-1 min-w-0">
                  {offer.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded bg-[#183324]/80 border border-[#2d6a4f]/50 text-[#a7f3d0] uppercase tracking-wider text-[8.5px] font-extrabold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="font-mono-tabular px-2 py-0.5 rounded-md bg-[#162c20] border border-[#34d399]/50 text-[#fff1b0] text-[10px] font-extrabold shrink-0 shadow-xs">
                  Lv {offer.currentLevel} → {offer.nextLevel}
                </span>
              </div>
            </div>
          </div>

          {/* ===============================================================
              DESKTOP LAYOUT (>= 900px): Vertical 6-Row Aligned Tarot Card
              =============================================================== */}
          <div className="ornate-card-desktop-grid relative z-10 w-full h-full">
            {/* Row 1 (28px): Numeral (left) + Rarity Chip (center) + Optional [1]/[2]/[3] Hotkey (right) */}
            <div
              data-card-row="desktop-header"
              className="flex items-center justify-between gap-1.5 pb-1 border-b-2 border-[#2d6a4f]/40 whitespace-nowrap overflow-hidden"
            >
              <span className="px-2 py-0.5 rounded bg-[#183324] border border-[#2d6a4f] text-[#fff1b0] font-display font-bold text-[11px] tracking-widest uppercase shrink-0">
                {tarotMeta.numeral}
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${rarityChipClass}`}
              >
                <RarityGemSvg rarity={rarity} className="w-2.5 h-2.5 shrink-0" />
                <span>{offer.subtitle}</span>
              </span>

              {showHotkey && (
                <span className="font-mono-tabular text-xs font-extrabold text-[#86efac] shrink-0">
                  [{index + 1}]
                </span>
              )}
            </div>

            {/* Row 2 (148px): Framed Arched Icon Art — Crisp & Unshaded on Desktop */}
            <div
              data-card-row="desktop-art"
              className="relative w-full h-[148px] rounded-xl border border-[#2d6a4f]/70 bg-[#0f2118]/80 flex items-center justify-center overflow-hidden"
            >
              <div className="h-full aspect-[180/132] flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-105">
                <TarotIllustrationSvg
                  targetId={offer.targetId}
                  rarity={offer.rarity}
                  iconColor={offer.iconColor}
                  className="w-full h-full object-contain block select-none"
                />
              </div>
            </div>

            {/* Row 3 (minmax(20px, auto)): Full Arcana Name on its own line (NEVER truncated) */}
            <div
              data-card-row="desktop-arcana"
              data-testid={`card-arcana-desktop-${index}`}
              className="flex items-center justify-center text-center px-1 font-extrabold uppercase tracking-[0.12em] text-[#86efac] leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]"
              style={{ fontSize: 'clamp(10px, 0.82vw, 11.5px)' }}
            >
              {tarotMeta.arcanaTitle}
            </div>

            {/* Row 4 (44px): Card Title Banner (2-line reserved height) */}
            <div
              data-card-row="desktop-title"
              className="h-[44px] px-2.5 py-1 rounded-lg bg-gradient-to-b from-[#1b3829] to-[#12241b] border-2 border-[#2d6a4f] shadow-sm flex items-center justify-center text-center"
            >
              <h3 className="text-[15px] leading-tight font-display font-bold text-[#fff8e7] line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                {offer.title}
              </h3>
            </div>

            {/* Row 5 (1fr, min 54px): Description Body (reserved height) */}
            <div
              data-card-row="desktop-description"
              className="flex items-start justify-center text-center px-1.5 pt-0.5"
            >
              <p className="text-xs font-semibold text-[#d4dec9] leading-snug line-clamp-3">
                {offer.description}
              </p>
            </div>

            {/* Row 6 (36px): Etched Divider + Synergy Tags (left) + Level Badge (right) */}
            <div
              data-card-row="desktop-footer"
              className="h-[36px] pt-1.5 border-t-2 border-[#2d6a4f]/40 flex items-center justify-between gap-1.5 text-[10px] font-bold"
            >
              <div className="flex flex-wrap items-center gap-1 min-w-0">
                {offer.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded bg-[#183324]/80 border border-[#2d6a4f]/50 text-[#a7f3d0] uppercase tracking-wider text-[9.5px] font-extrabold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="font-mono-tabular px-2 py-0.5 rounded bg-[#162c20] border border-[#34d399]/50 text-[#fff1b0] text-[10px] font-extrabold whitespace-nowrap shrink-0 shadow-xs">
                Lv {offer.currentLevel} → {offer.nextLevel}
              </span>
            </div>
          </div>
        </button>

        {/* =================================================================
            BACK FACE (StoreItemCards container with full edge-to-edge ornament)
            ================================================================= */}
        <div
          aria-hidden="true"
          className="ornate-draft-face ornate-draft-face-back absolute inset-0 rounded-[6px] pointer-events-none overflow-hidden border border-[#1e5e3a] bg-gradient-to-br from-[#13281e] via-[#0d1a14] to-[#070e0a] shadow-[0_12px_28px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(167,243,208,0.18)] flex items-center justify-center"
        >
          {/* Inner Bevel Hairline Frame */}
          <div className="absolute inset-[3px] rounded-[4px] border border-[#34d399]/25 pointer-events-none z-20" />

          {/* 4 Ornate Corner Filigree Flourishes in botanical emerald tone */}
          <TrinketCornerFiligreeSvg position="tl" variant="draft" />
          <TrinketCornerFiligreeSvg position="tr" variant="draft" />
          <TrinketCornerFiligreeSvg position="bl" variant="draft" />
          <TrinketCornerFiligreeSvg position="br" variant="draft" />

          {/* Full Back Ornament filling 100% of the whole card on mobile and desktop */}
          <div className="ornate-only-mobile absolute inset-0 w-full h-full z-10">
            <TarotCardBackSvg
              orientation="horizontal"
              preserveAspectRatio="none"
              className="w-full h-full block select-none pointer-events-none"
            />
          </div>
          <div className="ornate-only-desktop absolute inset-0 w-full h-full z-10">
            <TarotCardBackSvg
              orientation="vertical"
              preserveAspectRatio="none"
              className="w-full h-full block select-none pointer-events-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftCard;
