/**
 * @file DraftCard.tsx
 * Ornate Botanical Tarot Card component with 3D flip reveal (`revealing`, `ready`, `flippingBack`, `swapping`, `resolving`),
 * equal-height row-locked layout across desktop (>= 900px) and mobile (<= 899px),
 * zero truncation on arcana names, and subtle cursor-relative 3D tilt on desktop hover.
 */

import React, { useState } from 'react';
import type { DraftOfferItem } from '../../../sim/systems/cardDraft';
import { getTarotMetadata, TarotCardBackSvg, TarotIllustrationSvg } from '../../cards';
import {
  OrnateFrame,
  RARITY_GEM_COLORS,
  RarityGemSvg,
  type OrnateRarity,
} from '../../../ui/ornate';
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
  onSelect: (offerId: string) => void;
  cardRef?: (el: HTMLButtonElement | null) => void;
}

const RARITY_CHIP_STYLES: Readonly<Record<OrnateRarity, string>> = {
  common: 'bg-[#e8dcc8] text-[#453222] border-[#8c6d4e]/55',
  uncommon: 'bg-[#d1fae5] text-[#065f46] border-[#10b981]/60',
  rare: 'bg-[#e0f2fe] text-[#075985] border-[#0ea5e9]/60',
  epic: 'bg-[#f3e8ff] text-[#581c87] border-[#a855f7]/60',
  legendary: 'bg-[#fef3c7] text-[#92400e] border-[#f59e0b]/70',
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
  onSelect,
  cardRef,
}) => {
  const tarotMeta = getTarotMetadata(offer.targetId);
  const rarity = (offer.rarity as OrnateRarity) || 'uncommon';
  const rarityChipClass = RARITY_CHIP_STYLES[rarity] ?? RARITY_CHIP_STYLES.uncommon;
  const rarityGemInfo = RARITY_GEM_COLORS[rarity] ?? RARITY_GEM_COLORS.uncommon;

  // Subtle cursor-relative 3D tilt on desktop when phase === 'ready'
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
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

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (reducedMotion || !canInteract || e.pointerType === 'touch') return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: Math.max(-3.5, Math.min(3.5, -ny * 6)),
      ry: Math.max(-3.5, Math.min(3.5, nx * 6)),
    });
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setTilt({ rx: 0, ry: 0 });
  };

  // Resolve selection scale/fade styling
  const resolvingClass =
    phase === 'resolving'
      ? isSelected
        ? 'scale-[1.04] z-30 brightness-110'
        : isAnySelected
          ? 'opacity-0 scale-95 pointer-events-none'
          : 'opacity-40 scale-98 pointer-events-none'
      : '';

  return (
    <div
      className={`ornate-draft-perspective relative w-full h-full flex flex-col select-none transition-all duration-200 ${resolvingClass}`}
    >
      <div
        data-testid={`tarot-card-flip-wrapper-${index}`}
        data-flipping={phase === 'flippingBack' || phase === 'swapping' ? 'true' : 'false'}
        data-rerolled={rerollCount > 0 ? 'true' : 'false'}
        data-phase={phase}
        className="ornate-draft-flipper relative w-full h-full flex flex-col flex-1"
        style={{
          transitionProperty: 'transform, opacity',
          transitionDuration: `${durationMs}ms`,
          transitionTimingFunction: 'var(--ornate-ease-out)',
          transitionDelay: `${staggerMs}ms`,
          transform: reducedMotion
            ? 'none'
            : isFaceDown
              ? 'rotateY(180deg) scale(0.95)'
              : isHovered && canInteract
                ? `translateY(-7px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`
                : 'rotateY(0deg) scale(1)',
          opacity: reducedMotion && isFaceDown ? 0 : 1,
        }}
      >
        {/* =================================================================
            FRONT FACE (Polished Gold Ornate Frame + Parchment Interior)
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
          onPointerEnter={() => setIsHovered(true)}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          aria-label={`${tarotMeta.numeral} ${tarotMeta.arcanaTitle}: ${offer.title}, ${offer.subtitle}, Level ${offer.currentLevel} to ${offer.nextLevel}. ${offer.description}`}
          className={`ornate-draft-face group relative w-full h-full flex-1 text-left rounded-[18px] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#5fe0c8] ${
            canInteract ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <OrnateFrame
            variant="card"
            rarity={rarity}
            corners="vine"
            showSideGems={true}
            glow={isHovered || isSelected ? 'strong' : 'subtle'}
            surface="parchment"
            className="w-full h-full flex-1"
            innerClassName="p-2.5 sm:p-3 justify-between overflow-hidden"
          >
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
            <div className="ornate-card-mobile-grid">
              {/* Left Column (~26% width): Framed Illustrated Icon Art */}
              <div
                data-card-row="mobile-art"
                className="relative w-full h-full min-h-[86px] max-h-[124px] rounded-xl border-2 border-[#4a2d08] bg-gradient-to-b from-[#2a1d30] via-[#1c1322] to-[#120b16] p-1 flex items-center justify-center overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.75)]"
              >
                <div className="w-full h-full flex items-center justify-center scale-[1.06] origin-center transition-transform duration-200 group-hover:scale-[1.12]">
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
                  <span className="px-1.5 py-0.5 rounded bg-[#2a1c28] text-[#fff1b0] font-display font-bold text-[10px] tracking-widest uppercase shrink-0 shadow-xs">
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
                  className="font-extrabold uppercase tracking-wider text-[#6b421b] leading-none whitespace-nowrap"
                  style={{ fontSize: 'clamp(9px, 2.35vw, 11px)' }}
                >
                  {tarotMeta.arcanaTitle}
                </div>

                {/* Row 3 (20px): Card Title */}
                <h3
                  data-card-row="mobile-title"
                  className="text-sm sm:text-base font-display font-extrabold text-[#251824] leading-tight line-clamp-1"
                >
                  {offer.title}
                </h3>

                {/* Row 4 (minmax(28px, 1fr)): Description */}
                <p
                  data-card-row="mobile-description"
                  className="text-[11px] sm:text-xs font-semibold text-[#422c3e] leading-snug line-clamp-2 self-start"
                >
                  {offer.description}
                </p>

                {/* Row 5 (24px): Divider + Synergy Tags (Left) + Level Badge (Right) */}
                <div
                  data-card-row="mobile-footer"
                  className="flex items-center justify-between gap-1.5 pt-1 border-t border-[#3a2430]/20 text-[10px] font-bold"
                >
                  <div className="flex flex-wrap items-center gap-1 min-w-0">
                    {offer.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded bg-[#2a1c28]/10 text-[#3e293b] uppercase tracking-wider text-[8.5px] font-extrabold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="font-mono-tabular px-2 py-0.5 rounded-md bg-[#251824] border border-[#e8b84e]/50 text-[#fff1b0] text-[10px] font-extrabold shrink-0 shadow-xs">
                    Lv {offer.currentLevel} → {offer.nextLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* ===============================================================
                DESKTOP LAYOUT (>= 900px): Vertical 6-Row Aligned Tarot Card
                =============================================================== */}
            <div className="ornate-card-desktop-grid">
              {/* Row 1 (28px): Numeral (left) + Rarity Chip (center) + [1]/[2]/[3] Hotkey (right) */}
              <div
                data-card-row="desktop-header"
                className="flex items-center justify-between gap-1.5 pb-1 border-b-2 border-[#3a2430]/20 whitespace-nowrap overflow-hidden"
              >
                <span className="px-2 py-0.5 rounded bg-[#251824] border border-[#e8b84e]/45 text-[#fff1b0] font-display font-bold text-[11px] tracking-widest uppercase shrink-0">
                  {tarotMeta.numeral}
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${rarityChipClass}`}
                >
                  <RarityGemSvg rarity={rarity} className="w-2.5 h-2.5 shrink-0" />
                  <span>{offer.subtitle}</span>
                </span>

                <span className="font-mono-tabular text-xs font-extrabold text-[#5b4355] shrink-0">
                  [{index + 1}]
                </span>
              </div>

              {/* Row 2 (148px): Framed Arched Icon Art */}
              <div
                data-card-row="desktop-art"
                className="relative w-full h-[148px] rounded-xl border-2 border-[#4a2d08] bg-gradient-to-b from-[#2b1d32] via-[#1c1222] to-[#110a16] flex items-center justify-center overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-35"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${rarityGemInfo.mid} 0%, transparent 72%)`,
                  }}
                />
                <div className="h-full aspect-[180/132] flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.06]">
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
                className="flex items-center justify-center text-center px-1 font-extrabold uppercase tracking-[0.12em] text-[#6b421b] leading-tight"
                style={{ fontSize: 'clamp(10px, 0.82vw, 11.5px)' }}
              >
                {tarotMeta.arcanaTitle}
              </div>

              {/* Row 4 (44px): Card Title Banner (2-line reserved height) */}
              <div
                data-card-row="desktop-title"
                className="h-[44px] px-2.5 py-1 rounded-lg bg-gradient-to-b from-[#332138] to-[#211525] border-2 border-[#9a6418] shadow-sm flex items-center justify-center text-center"
              >
                <h3 className="text-[15px] leading-tight font-display font-bold text-[#fdf8eb] line-clamp-2">
                  {offer.title}
                </h3>
              </div>

              {/* Row 5 (1fr, min 54px): Description Body (reserved height) */}
              <div
                data-card-row="desktop-description"
                className="flex items-start justify-center text-center px-1.5 pt-0.5"
              >
                <p className="text-xs font-semibold text-[#3a2638] leading-snug line-clamp-3">
                  {offer.description}
                </p>
              </div>

              {/* Row 6 (36px): Etched Divider + Synergy Tags (left) + Level Badge (right) */}
              <div
                data-card-row="desktop-footer"
                className="h-[36px] pt-1.5 border-t-2 border-[#3a2430]/20 flex items-center justify-between gap-1.5 text-[10px] font-bold"
              >
                <div className="flex flex-wrap items-center gap-1 min-w-0">
                  {offer.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded bg-[#251824]/10 text-[#473245] uppercase tracking-wider text-[9.5px] font-extrabold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="font-mono-tabular px-2 py-0.5 rounded bg-[#251824] border border-[#e8b84e]/55 text-[#fff1b0] text-[10px] font-extrabold whitespace-nowrap shrink-0 shadow-xs">
                  Lv {offer.currentLevel} → {offer.nextLevel}
                </span>
              </div>
            </div>
          </OrnateFrame>
        </button>

        {/* =================================================================
            BACK FACE (Gold-Vine Sigil on Deep Plum/Emerald inside OrnateFrame)
            ================================================================= */}
        <div
          aria-hidden="true"
          className="ornate-draft-face ornate-draft-face-back absolute inset-0 rounded-[18px] pointer-events-none overflow-hidden"
        >
          <OrnateFrame
            variant="card"
            rarity={rarity}
            corners="vine"
            glow="subtle"
            surface="velvet"
            className="w-full h-full"
            innerClassName="p-1.5 items-center justify-center overflow-hidden"
          >
            <div className="ornate-only-mobile w-full h-full items-center justify-center">
              <TarotCardBackSvg orientation="horizontal" />
            </div>
            <div className="ornate-only-desktop w-full h-full items-center justify-center">
              <TarotCardBackSvg orientation="vertical" />
            </div>
          </OrnateFrame>
        </div>
      </div>
    </div>
  );
};

export default DraftCard;
