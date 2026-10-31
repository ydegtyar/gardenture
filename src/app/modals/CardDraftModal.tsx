/**
 * @file CardDraftModal.tsx
 * @llm-tag modal:card-draft
 * @llm-context Botanical Tarot 3-card level-up upgrade drafting modal with orientation-aware 3D flip animations, up to 3x Ad & Coin reroll limits, Coin Revive-styled Coin Reroll button, and restorative Skip button.
 * @llm-description Rendered whenever the player levels up during a run. Presents 3 antique botanical tarot cards with responsive portrait horizontal banners and landscape vertical arcana columns.
 */

import React, { useRef, useState } from 'react';
import { Simulation } from '../../sim/Simulation';
import type { DraftOfferItem } from '../../sim/systems/cardDraft';
import { CoinIcon } from '../SvgIcons';
import { getTarotMetadata, TarotCardBackSvg, TarotIllustrationSvg } from '../cards';
import { useGameShell } from '../context/GameShellContext';
import { LazyModalDebugCardsButton } from '../debug/LazyDebugComponents';
import { IS_DEV } from '../debug/devGate';
import { cn } from '../../utils/cn';

/**
 * @llm-component CardDraftModal
 * @llm-hook level-up-draft: presents 3 tarot card choices on player level up
 */
export function CardDraftModal() {
  const {
    hud,
    draftOffers,
    freeRerollAvailable,
    freeRerollsRemaining,
    canAdReroll,
    adRerollsRemaining,
    coinRerollsRemaining,
    isAdLoading,
    saveData,
    handleSelectCardOffer,
    handleRerollFree,
    handleRerollAd,
    handleRerollCoins,
    handleSkipDraft,
    openDebugMenu,
  } = useGameShell();

  const level = hud.level;
  const offers = draftOffers;
  const coins = saveData.currencies.coins;
  const onSelectOffer = handleSelectCardOffer;
  const onRerollFree = handleRerollFree;
  const onRerollAd = handleRerollAd;
  const onRerollCoins = handleRerollCoins;
  const onSkip = handleSkipDraft;
  const onOpenDebugCards = IS_DEV ? openDebugMenu : undefined;

  const [isFlipping, setIsFlipping] = useState(false);
  const [hasRerolled, setHasRerolled] = useState(false);
  const flipTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeSwipeIndex, setActiveSwipeIndex] = useState(0);
  const offersSignature = offers.map((o) => o.offerId).join('|');
  const prevOffersSigRef = useRef(offersSignature);
  const internalFlipRef = useRef(false);

  // Mouse drag-to-swipe handling for narrow landscape screens
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const scrollStartLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  React.useEffect(() => {
    return () => {
      if (flipTimerRef.current) {
        clearTimeout(flipTimerRef.current);
      }
    };
  }, []);

  // Ensure any external reroll (e.g. keyboard shortcut or async ad callback) also triggers the 3D flip animation
  React.useEffect(() => {
    if (prevOffersSigRef.current !== offersSignature) {
      prevOffersSigRef.current = offersSignature;
      if (!internalFlipRef.current) {
        setHasRerolled(true);
        setIsFlipping(true);
        if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
        flipTimerRef.current = setTimeout(() => {
          setIsFlipping(false);
        }, 280);
      }
    }
  }, [offersSignature]);

  // Track active scroll snap card on mobile landscape swiping
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el || el.clientWidth === 0) return;
    const scrollPos = el.scrollLeft;
    const cardStep = (el.firstElementChild as HTMLElement)?.offsetWidth || 256;
    const computedIndex = Math.round(scrollPos / (cardStep + 14));
    const clampedIndex = Math.max(0, Math.min(offers.length - 1, computedIndex));
    if (clampedIndex !== activeSwipeIndex) {
      setActiveSwipeIndex(clampedIndex);
    }
  };

  const scrollToIndex = (index: number) => {
    if (!sliderRef.current) return;
    const children = sliderRef.current.children;
    if (children[index]) {
      (children[index] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !sliderRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartXRef.current = e.pageX;
    scrollStartLeftRef.current = sliderRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !sliderRef.current) return;
    const deltaX = e.pageX - dragStartXRef.current;
    if (Math.abs(deltaX) > 6) {
      hasDraggedRef.current = true;
    }
    sliderRef.current.scrollLeft = scrollStartLeftRef.current - deltaX;
  };

  const handleMouseUpOrLeave = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
  };

  const triggerRerollWithFlip = (rerollAction: () => unknown) => {
    if (isFlipping || isAdLoading) return;
    internalFlipRef.current = true;
    setHasRerolled(true);
    setIsFlipping(true);

    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);

    // Halfway through the 3D flip (~260ms), execute the reroll state change so new cards are revealed on unflip
    flipTimerRef.current = setTimeout(() => {
      void Promise.resolve(rerollAction()).finally(() => {
        flipTimerRef.current = setTimeout(() => {
          setIsFlipping(false);
          internalFlipRef.current = false;
        }, 120);
      });
    }, 260);
  };

  const showCoinsRerollButton = coins >= 40 && coinRerollsRemaining > 0;
  const canSpendCoinsReroll = showCoinsRerollButton && !isFlipping && !isAdLoading;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-2.5 sm:p-4 bg-[#140E16]/45 backdrop-blur-[1px] pointer-events-auto overflow-y-auto overflow-x-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="draft-modal-title"
    >
      <div className="w-full max-w-[560px] landscape:max-w-4xl rounded-2xl bg-gradient-to-b from-[#312334]/90 via-[#2B1F2D]/85 to-[#221724]/90 backdrop-blur-md border border-[#E8B64A]/30 shadow-[0_20px_50px_rgba(0,0,0,0.65),0_0_30px_rgba(45,30,47,0.5)] p-3.5 sm:p-5 landscape:p-5 text-[#FFFDF0] my-auto overflow-visible">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#FFFDF0]/15">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-extrabold tracking-widest text-[#A8E6CF] uppercase">
              LEVEL {level} REACHED · DRAW ONE BOTANICAL ARCANA
            </p>
            <h2
              id="draft-modal-title"
              className="text-xl sm:text-2xl landscape:text-3xl font-display font-bold text-[#FFFDF0] leading-tight"
            >
              Botanical Tarot Draft
            </h2>
          </div>

          <div
            data-testid="draft-modal-coin-badge"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C131F] border border-[#E8B64A]/45 shadow-inner text-sm font-mono-tabular font-bold text-[#FDFFB6] shrink-0"
          >
            <CoinIcon />
            <span>{coins}</span>
          </div>
        </div>

        {/* Tarot Cards Container:
            - Portrait mode: Vertical stack of 3 lush horizontal Tarot banners (all 3 fit comfortably without scrolling).
            - Landscape mode: 3-column antique vertical Tarot cards with horizontal swipe support on compact landscape screens.
            - Overflow is kept visible during 3D flips with generous padding so perspective rotation is never cropped.
        */}
        <div
          ref={sliderRef}
          data-testid="tarot-cards-sliding-row"
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={cn(
            'flex flex-col landscape:flex-row lg:landscape:grid lg:landscape:grid-cols-3 snap-x snap-mandatory gap-2.5 sm:gap-3.5 py-3 px-2.5 -my-1.5 -mx-2.5 mb-2.5 touch-pan-x select-none items-stretch',
            isFlipping
              ? 'overflow-visible'
              : 'overflow-visible max-lg:landscape:overflow-x-auto lg:landscape:overflow-visible'
          )}
        >
          {offers.map((offer, idx) => {
            const tarotMeta = getTarotMetadata(offer.targetId);
            const outerFrameStyles =
              offer.rarity === 'legendary'
                ? 'border-[#FBBF24] bg-gradient-to-br from-[#FFFDF4] via-[#FEF3C7] to-[#FDE68A] shadow-[0_8px_24px_rgba(251,191,36,0.3)]'
                : offer.rarity === 'rare'
                  ? 'border-[#7DD3FC] bg-gradient-to-br from-[#FFFDF7] via-[#EFF6FF] to-[#DBEAFE] shadow-[0_8px_20px_rgba(96,165,250,0.24)]'
                  : offer.rarity === 'uncommon'
                    ? 'border-[#6EE7B7] bg-gradient-to-br from-[#FFFDF7] via-[#ECFDF5] to-[#D1FAE5] shadow-[0_6px_16px_rgba(52,211,153,0.18)]'
                    : 'border-[#D6C7B2] bg-gradient-to-br from-[#FFFDF7] via-[#FAF5E8] to-[#EFE5D4] shadow-[0_6px_14px_rgba(0,0,0,0.22)]';

            const rarityPillStyles =
              offer.rarity === 'legendary'
                ? 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/50'
                : offer.rarity === 'rare'
                  ? 'bg-[#E0F2FE] text-[#1E40AF] border-[#38BDF8]/50'
                  : offer.rarity === 'uncommon'
                    ? 'bg-[#D1FAE5] text-[#065F46] border-[#34D399]/50'
                    : 'bg-[#EFE6D5] text-[#4A3B4E] border-[#8C5A3C]/35';

            const gemColor =
              offer.rarity === 'legendary'
                ? '#FBBF24'
                : offer.rarity === 'rare'
                  ? '#38BDF8'
                  : offer.rarity === 'uncommon'
                    ? '#10B981'
                    : '#A8A29E';

            const staggerDelayMs = idx * 65;

            return (
              <div
                key={`tarot-slot-${idx}`}
                className="perspective-1000 overflow-visible w-full max-lg:landscape:w-[262px] max-lg:landscape:max-w-[78vw] lg:landscape:w-auto shrink-0 snap-center flex flex-col"
              >
                <div
                  data-testid={`tarot-card-flip-wrapper-${idx}`}
                  data-flipping={isFlipping ? 'true' : 'false'}
                  data-rerolled={hasRerolled ? 'true' : 'false'}
                  className="tarot-card-flip-3d animate-tarot-flip-in overflow-visible relative w-full h-full flex flex-col flex-1"
                  style={{
                    transitionDelay: `${staggerDelayMs}ms`,
                    animationDelay: `${staggerDelayMs}ms`,
                  }}
                >
                  {/* Card Front Face */}
                  <button
                    type="button"
                    data-testid={`tarot-card-offer-${idx}`}
                    onClick={() => {
                      if (!isFlipping && !hasDraggedRef.current) {
                        onSelectOffer(offer.offerId);
                      }
                    }}
                    className={cn(
                      'group backface-hidden w-full h-full flex-1 text-left rounded-2xl text-[#2D1E2F] border-[3px] p-1.5 sm:p-2 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5FE0C8] cursor-pointer',
                      outerFrameStyles
                    )}
                  >
                    {/* Inner Vintage Ink Tarot Frame */}
                    <div className="w-full h-full flex-1 rounded-xl border-2 border-[#2D1E2F] p-2 sm:p-2.5 flex flex-col justify-between bg-gradient-to-b from-[#FFFDF7]/95 via-[#FAF4E4]/90 to-[#F3EAD3]/95 landscape:min-h-[348px]">
                      {/* =========================================================
                          PORTRAIT LAYOUT: Rich Horizontal Botanical Arcana Banner
                          ========================================================= */}
                      <div className="flex landscape:hidden items-center gap-3 sm:gap-4 w-full">
                        {/* Left Arched Tarot Illustration Alcove (scaled up) */}
                        <div className="w-[124px] sm:w-[144px] shrink-0 rounded-xl border-2 border-[#2D1E2F] bg-gradient-to-b from-[#2A1D2E] to-[#1A121E] p-1 flex items-center justify-center relative overflow-hidden shadow-md group-hover:scale-[1.03] transition-transform">
                          <div className="w-full scale-[1.12] origin-center">
                            <TarotIllustrationSvg
                              targetId={offer.targetId}
                              rarity={offer.rarity}
                              iconColor={offer.iconColor}
                            />
                          </div>
                          <span
                            className="absolute top-1.5 left-1.5 w-2 h-2 rotate-45 border border-[#2D1E2F] shadow-xs"
                            style={{ backgroundColor: gemColor }}
                          />
                        </div>

                        {/* Right Content Column: Arcana Header, Title, Description, Tags */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            {/* Top Row: Numeral + Arcana Title + Rarity Pill + Level Badge */}
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="px-1.5 py-0.5 rounded bg-[#2D1E2F] text-[#FDFFB6] font-display font-bold text-[10px] tracking-widest uppercase shrink-0 shadow-xs">
                                  {tarotMeta.numeral}
                                </span>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6E493A] truncate">
                                  {tarotMeta.arcanaTitle}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <span
                                  className={cn(
                                    'px-1.5 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wider',
                                    rarityPillStyles
                                  )}
                                >
                                  {offer.subtitle}
                                </span>
                                <span className="portrait:hidden font-mono-tabular text-xs font-bold text-[#5C4760]">
                                  [{idx + 1}]
                                </span>
                              </div>
                            </div>

                            {/* Card Title */}
                            <h3 className="text-base sm:text-lg font-display font-bold text-[#2D1E2F] leading-tight">
                              {offer.title}
                            </h3>

                            {/* Card Description */}
                            <p className="text-xs sm:text-[13px] font-semibold text-[#3D2B40] leading-snug mt-0.5">
                              {offer.description}
                            </p>
                          </div>

                          {/* Bottom Row: Synergy Tags & Level Progression Pill */}
                          <div className="flex items-center justify-between gap-2 pt-1.5 mt-1.5 border-t border-[#2D1E2F]/15 text-[10px] font-bold">
                            <div className="flex flex-wrap items-center gap-1 min-w-0">
                              {offer.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-1.5 py-0.5 rounded bg-[#2D1E2F]/8 text-[#4A354F] uppercase tracking-wider text-[9px] font-extrabold"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <span className="font-mono-tabular px-2 py-0.5 rounded-md bg-[#2D1E2F] text-[#FDFFB6] text-[10px] font-bold shrink-0 shadow-xs">
                              Lv {offer.currentLevel} → {offer.nextLevel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* =========================================================
                          LANDSCAPE LAYOUT: Classic Vertical Tarot Column
                          ========================================================= */}
                      <div className="hidden landscape:flex flex-col justify-between h-full">
                        <div>
                          {/* Top Roman Numeral Cartouche & Rarity Gem */}
                          <div className="flex items-center justify-between gap-1 pb-1.5 mb-2 border-b-2 border-[#2D1E2F]/20">
                            <span className="px-2 py-0.5 rounded bg-[#2D1E2F] text-[#FDFFB6] font-display font-bold text-[11px] tracking-widest uppercase">
                              {tarotMeta.numeral}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rotate-45 border border-[#2D1E2F] inline-block"
                                style={{ backgroundColor: gemColor }}
                              />
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C4760]">
                                {offer.subtitle}
                              </span>
                            </div>
                            <span className="portrait:hidden font-mono-tabular text-xs font-bold text-[#5C4760]">
                              [{idx + 1}]
                            </span>
                          </div>

                          {/* Central Arched Old-World Tarot Illustration (scaled up) */}
                          <div className="w-44 sm:w-52 mx-auto mb-2.5 overflow-hidden rounded-xl transition-transform duration-200 group-hover:scale-[1.04]">
                            <div className="w-full scale-[1.12] origin-center">
                              <TarotIllustrationSvg
                                targetId={offer.targetId}
                                rarity={offer.rarity}
                                iconColor={offer.iconColor}
                              />
                            </div>
                          </div>

                          {/* Vintage Ribbon Scroll Title Banner */}
                          <div className="relative bg-gradient-to-b from-[#352438] to-[#241827] text-[#FFFDF0] rounded-lg px-2.5 py-1.5 text-center mb-2 border-2 border-[#8C5A3C] shadow-sm">
                            <div className="text-[10px] font-bold tracking-widest uppercase text-[#FDFFB6]/90">
                              {tarotMeta.arcanaTitle}
                            </div>
                            <h3 className="text-base font-display font-bold text-[#FFFDF0] leading-tight">
                              {offer.title}
                            </h3>
                          </div>

                          {/* Parchment Scripture Effect Box */}
                          <p className="text-xs font-semibold text-[#3D2B40] leading-snug text-center px-1 mb-2">
                            {offer.description}
                          </p>
                        </div>

                        {/* Bottom Esoteric Synergy & Level Footer */}
                        <div className="pt-2 border-t-2 border-[#2D1E2F]/15 flex items-center justify-between gap-1.5 text-[11px] text-[#5C4760] font-bold">
                          <span className="uppercase tracking-wider truncate">{offer.tags.join(' · ')}</span>
                          <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-[#2D1E2F] text-[#FDFFB6] text-[10px] whitespace-nowrap shrink-0">
                            Lv {offer.currentLevel} → {offer.nextLevel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Card Back Face (Orientation-matched horizontal or vertical backplate during 3D flip) */}
                  <div
                    aria-hidden="true"
                    className="backface-hidden tarot-card-back-face absolute inset-0 rounded-2xl border-[3px] border-[#8C5A3C] bg-[#2D1E2F] p-1.5 flex items-center justify-center shadow-2xl pointer-events-none overflow-hidden"
                  >
                    <div className="w-full h-full flex landscape:hidden items-center justify-center">
                      <TarotCardBackSvg orientation="horizontal" />
                    </div>
                    <div className="w-full h-full hidden landscape:flex items-center justify-center">
                      <TarotCardBackSvg orientation="vertical" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Landscape Compact Swipe Pagination Dots */}
        {offers.length > 1 && (
          <div className="hidden max-lg:landscape:flex items-center justify-center gap-2 mb-3">
            {offers.map((_, dotIdx) => (
              <button
                key={`swipe-dot-${dotIdx}`}
                type="button"
                aria-label={`Go to card ${dotIdx + 1}`}
                onClick={() => scrollToIndex(dotIdx)}
                className={cn(
                  'transition-all duration-200 rounded-full h-1.5',
                  dotIdx === activeSwipeIndex
                    ? 'w-6 bg-[#FDFFB6]'
                    : 'w-2 bg-[#FFFDF0]/30 hover:bg-[#FFFDF0]/60'
                )}
              />
            ))}
          </div>
        )}

        {/* Reroll, Debug & Restorative Skip Action Bar */}
        <div className="pt-2.5 border-t border-[#FFFDF0]/12 flex flex-col lg:landscape:flex-row items-stretch lg:landscape:items-center justify-between gap-2.5">
          {/* Left Group: Free / Ad Reroll + Coin Revive-styled Coin Reroll */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:landscape:flex lg:landscape:flex-row items-stretch sm:items-center gap-2.5">
            {freeRerollAvailable ? (
              <button
                type="button"
                data-testid="draft-reroll-free-btn"
                disabled={isFlipping || isAdLoading}
                onClick={() => triggerRerollWithFlip(onRerollFree)}
                className="w-full lg:landscape:min-w-[235px] btn-herbarium-lichen px-4 py-2 flex items-center justify-between text-left gap-4 min-h-[50px]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#101F12]/20 border border-[#101F12]/25 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#101F12]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                      <path d="M16 16h5v5" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-display font-bold text-[#101F12] leading-tight whitespace-nowrap">
                      Free Reroll
                    </div>
                    <div className="text-[10px] font-bold text-[#101F12]/80 whitespace-nowrap">
                      Trinket Blessing
                    </div>
                  </div>
                </div>
                <span
                  data-testid="draft-reroll-free-count"
                  className="bg-[#101F12] text-[#A8E6CF] text-[10px] font-mono-tabular font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                >
                  {freeRerollsRemaining} Left
                </span>
              </button>
            ) : canAdReroll ? (
              <button
                type="button"
                data-testid="draft-reroll-ad-btn"
                disabled={isFlipping || isAdLoading || adRerollsRemaining <= 0}
                onClick={() => triggerRerollWithFlip(onRerollAd)}
                className="w-full lg:landscape:min-w-[245px] btn-herbarium-lichen px-4 py-2 flex items-center justify-between text-left gap-4 min-h-[50px]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#101F12]/20 border border-[#101F12]/25 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#101F12]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5.14v14l11-7-11-7z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-display font-bold text-[#101F12] leading-tight whitespace-nowrap">
                      {isAdLoading ? 'Loading Ad...' : 'Watch Ad to Reroll'}
                    </div>
                    <div className="text-[10px] font-bold text-[#101F12]/80 font-mono-tabular whitespace-nowrap">
                      Ad Rerolls: {adRerollsRemaining}/{Simulation.MAX_AD_REROLLS} Left
                    </div>
                  </div>
                </div>
                <span className="bg-[#101F12] text-[#EDE6D0] text-[10px] font-mono-tabular font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  {adRerollsRemaining}/{Simulation.MAX_AD_REROLLS}
                </span>
              </button>
            ) : null}

            {/* Coin Reroll Button styled like Coin Revive Button from RescueReviveModal with space-between (hidden when coins < 40) */}
            {showCoinsRerollButton && (
              <button
                type="button"
                data-testid="draft-reroll-coins-btn"
                disabled={!canSpendCoinsReroll}
                onClick={() => triggerRerollWithFlip(onRerollCoins)}
                className="w-full lg:landscape:min-w-[255px] btn-herbarium-primary justify-between px-4 py-2 flex items-center text-left gap-4 group min-h-[50px]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#201A09]/15 border border-[#201A09]/20 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#201A09]" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 9C6 6.5 8.5 4.5 12 4.5C15.5 4.5 18 6.5 18 9L19.5 17.5C19.8 19.2 18.5 20.5 16.8 20.5H7.2C5.5 20.5 4.2 19.2 4.5 17.5L6 9Z"
                        fill="currentColor"
                        fillOpacity="0.2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <circle cx="12" cy="13.5" r="3.5" fill="currentColor" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs lg:text-sm font-display font-bold text-[#201A09] leading-tight whitespace-nowrap">
                      Reroll with Coins
                    </div>
                    <div className="text-[10px] text-[#201A09]/80 font-sans font-bold font-mono-tabular whitespace-nowrap">
                      Vault: {coins} · {coinRerollsRemaining}/{Simulation.MAX_COIN_REROLLS} Left
                    </div>
                  </div>
                </div>

                <span className="flex items-center gap-1 text-xs font-mono-tabular bg-[#201A09] text-[#EDE6D0] px-2.5 py-1 rounded-full font-bold shadow-sm shrink-0">
                  <CoinIcon className="w-3.5 h-3.5" />
                  40
                </span>
              </button>
            )}
          </div>

          {/* Right Group: Lazy Dev Debug Button + Restorative Skip Button */}
          <div className="flex items-center justify-end gap-2">
            {onOpenDebugCards && (
              <LazyModalDebugCardsButton onOpen={onOpenDebugCards} variant="draft" />
            )}

            <button
              type="button"
              data-testid="draft-skip-btn"
              disabled={isFlipping || isAdLoading}
              onClick={onSkip}
              className="btn-herbarium-skip px-3.5 py-2 text-left flex-1 sm:flex-initial min-h-[50px]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#A8E6CF]/15 border border-[#A8E6CF]/35 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#A8E6CF]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-display font-bold text-[#FFFDF0] leading-tight whitespace-nowrap">
                    Skip Draft
                  </div>
                  <div className="text-[10px] font-bold text-[#A8E6CF] whitespace-nowrap">
                    Herbal Rest
                  </div>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-[#0E1A17] border border-[#A8E6CF]/40 text-[#FDFFB6] font-mono-tabular text-[11px] font-extrabold whitespace-nowrap shrink-0 shadow-inner">
                +10 HP · +100 Score
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
