/**
 * @file CardDraftModal.tsx
 * @llm-tag modal:card-draft
 * @llm-context Botanical Tarot 3-card level-up upgrade drafting modal with 3D flip card animations, reroll actions (free/ad/gold), and skip option.
 * @llm-description Rendered whenever the player levels up during a run. Presents 3 antique botanical tarot cards with stagger flip animations.
 */

import React, { useRef, useState } from 'react';
import type { DraftOfferItem } from '../../sim/systems/cardDraft';
import { CoinIcon } from '../SvgIcons';
import { getTarotMetadata, TarotCardBackSvg, TarotIllustrationSvg } from '../TarotCardArt';

export interface CardDraftModalProps {
  level: number;
  offers: DraftOfferItem[];
  freeRerollAvailable: boolean;
  canAdReroll: boolean;
  coins: number;
  onSelectOffer: (offerId: string) => void;
  onRerollFree: () => void;
  onRerollAd: () => void;
  onRerollCoins: () => void;
  onSkip: () => void;
  onOpenDebugCards?: () => void;
}

/**
 * @llm-component CardDraftModal
 * @llm-hook level-up-draft: presents 3 tarot card choices on player level up
 */
export function CardDraftModal({
  level,
  offers,
  freeRerollAvailable,
  canAdReroll,
  coins,
  onSelectOffer,
  onRerollFree,
  onRerollAd,
  onRerollCoins,
  onSkip,
  onOpenDebugCards,
}: CardDraftModalProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  const flipTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeSwipeIndex, setActiveSwipeIndex] = useState(0);

  // Mouse drag-to-swipe handling
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

  // Track active scroll snap card on mobile / trackpad swiping
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el || el.clientWidth === 0) return;
    const scrollPos = el.scrollLeft;
    // Calculate index based on card width + gap (~256px + 14px)
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
    // Only engage drag scrolling on secondary or primary button without modifier
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

  const triggerRerollWithFlip = (rerollAction: () => void) => {
    if (isFlipping) return;
    setIsFlipping(true);

    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);

    // Halfway through the flip (~260ms), execute the reroll state change so new cards are revealed
    flipTimerRef.current = setTimeout(() => {
      rerollAction();
      // Allow the reverse unflip reveal to finish
      flipTimerRef.current = setTimeout(() => {
        setIsFlipping(false);
      }, 340);
    }, 260);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-2.5 sm:p-4 bg-[#140E16]/85 pointer-events-auto overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="draft-modal-title"
    >
      <div className="w-full max-w-4xl rounded-2xl bg-[#2B1F2D] border-4 border-[#2D1E2F] shadow-2xl p-3 sm:p-5 md:p-6 text-[#FFFDF0] my-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 md:mb-4 pb-2.5 md:pb-3 border-b border-[#FFFDF0]/15">
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#A8E6CF]">
              LEVEL {level} REACHED · DRAW ONE BOTANICAL ARCANA
            </p>
            <h2 id="draft-modal-title" className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-[#FFFDF0]">
              Botanical Tarot Draft
            </h2>
          </div>
          <div className="flex items-center gap-3 text-sm font-mono-tabular text-[#FDFFB6]">
            <span className="flex items-center gap-1.5">
              <CoinIcon />
              {coins}
            </span>
          </div>
        </div>

        {/* Tarot Cards:
            - Portrait mode / mobile: Vertical column of compact horizontal rows (all 3 visible at once without scrolling off screen).
            - Landscape mode (md / landscape): 3-column equal-height card grid with swipe/scroll support.
        */}
        <div
          ref={sliderRef}
          data-testid="tarot-cards-sliding-row"
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="flex flex-col landscape:flex-row md:flex-row md:grid md:grid-cols-3 landscape:grid landscape:grid-cols-3 overflow-y-visible landscape:overflow-x-auto md:overflow-visible snap-x snap-mandatory gap-2.5 sm:gap-3.5 pb-2 mb-3 -mx-1 px-1 touch-pan-x cursor-grab active:cursor-grabbing select-none items-stretch md:items-stretch landscape:items-stretch"
        >
          {offers.map((offer, idx) => {
            const tarotMeta = getTarotMetadata(offer.targetId);
            const outerFrameStyles =
              offer.rarity === 'legendary'
                ? 'border-[#FBBF24] bg-gradient-to-b from-[#FFFDF0] via-[#FEF9E7] to-[#F9EBB2] shadow-[0_8px_24px_rgba(251,191,36,0.28)]'
                : offer.rarity === 'rare'
                  ? 'border-[#A0C4FF] bg-gradient-to-b from-[#FFFDF0] via-[#F4F8FF] to-[#E5EEFF] shadow-[0_8px_20px_rgba(160,196,255,0.2)]'
                  : offer.rarity === 'uncommon'
                    ? 'border-[#88D49E] bg-gradient-to-b from-[#FFFDF0] via-[#F4FBF7] to-[#E6F5EC]'
                    : 'border-[#C4B5A6] bg-gradient-to-b from-[#FFFDF0] via-[#FAF5E8] to-[#EFE6D5]';

            const gemColor =
              offer.rarity === 'legendary'
                ? '#FBBF24'
                : offer.rarity === 'rare'
                  ? '#60A5FA'
                  : offer.rarity === 'uncommon'
                    ? '#34D399'
                    : '#A8A29E';

            // Stagger animation timing slightly per card slot for an authentic dealer flourish
            const staggerDelayMs = idx * 60;

            return (
              <div
                key={`tarot-slot-${idx}`}
                className="perspective-1000 w-full landscape:w-[256px] landscape:max-w-[75vw] sm:landscape:w-[270px] md:w-auto md:max-w-none shrink-0 snap-center flex flex-col h-full"
              >
                <div
                  className="preserve-3d w-full h-full flex flex-col flex-1 transition-transform duration-500 ease-out"
                  style={{
                    transform: isFlipping ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transitionDelay: `${staggerDelayMs}ms`,
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
                    className={`backface-hidden w-full h-full flex-1 text-left rounded-xl sm:rounded-2xl text-[#2D1E2F] border-3 sm:border-4 ${outerFrameStyles} p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5FE0C8] focus-visible:shadow-[0_0_14px_rgba(95,224,200,0.5)]`}
                  >
                    {/* Inner Vintage Ink Tarot Border */}
                    <div className="w-full h-full flex-1 rounded-lg sm:rounded-xl border-2 border-[#2D1E2F] p-2 sm:p-2.5 flex flex-col justify-between bg-[#FFFDF0]/75 min-h-[92px] landscape:min-h-[350px] md:min-h-[360px]">
                      {/* Portrait Layout: Compact Horizontal Row */}
                      <div className="flex landscape:hidden md:hidden items-center gap-3 w-full">
                        {/* Compact Tarot Illustration Stamp */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg border-2 border-[#2D1E2F] bg-[#2D1E2F]/5 p-1 flex items-center justify-center relative overflow-hidden">
                          <TarotIllustrationSvg
                            targetId={offer.targetId}
                            rarity={offer.rarity}
                            iconColor={offer.iconColor}
                          />
                          <span
                            className="absolute top-1 left-1 w-2 h-2 rotate-45 border border-[#2D1E2F]"
                            style={{ backgroundColor: gemColor }}
                          />
                        </div>

                        {/* Title, Numeral, Description & Tags */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-[#2D1E2F] text-[#FDFFB6] font-display font-bold text-[10px] tracking-widest uppercase">
                              {tarotMeta.numeral}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C4760] truncate">
                              {offer.subtitle}
                            </span>
                            <span className="font-mono-tabular text-xs font-bold text-[#5C4760] shrink-0">
                              [{idx + 1}]
                            </span>
                          </div>

                          <h3 className="text-sm sm:text-base font-display font-bold text-[#2D1E2F] leading-tight truncate">
                            {offer.title}
                          </h3>

                          <p className="text-xs font-semibold text-[#3D2B40] leading-snug line-clamp-2 my-0.5">
                            {offer.description}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-[#5C4760] font-bold mt-0.5">
                            <span className="uppercase tracking-wider truncate">{offer.tags.join(' · ')}</span>
                            <span className="font-mono-tabular px-1 py-0.2 rounded bg-[#2D1E2F]/10 text-[#2D1E2F] shrink-0">
                              Lv {offer.currentLevel} → {offer.nextLevel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Landscape & Desktop Layout: Classic Antique Tarot Column */}
                      <div className="hidden landscape:flex md:flex flex-col justify-between h-full">
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
                            <span className="font-mono-tabular text-xs font-bold text-[#5C4760]">
                              [{idx + 1}]
                            </span>
                          </div>

                          {/* Central Arched Old-World Tarot Illustration */}
                          <div className="w-32 sm:w-36 mx-auto mb-2 transition-transform duration-200 group-hover:scale-[1.03]">
                            <TarotIllustrationSvg
                              targetId={offer.targetId}
                              rarity={offer.rarity}
                              iconColor={offer.iconColor}
                            />
                          </div>

                          {/* Vintage Ribbon Scroll Title Banner */}
                          <div className="relative bg-[#2D1E2F] text-[#FFFDF0] rounded-lg px-2.5 py-1.5 text-center mb-2 border-2 border-[#8C5A3C] shadow-sm">
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
                        <div className="pt-2 border-t-2 border-[#2D1E2F]/15 flex items-center justify-between text-[11px] text-[#5C4760] font-bold">
                          <span className="uppercase tracking-wider">{offer.tags.join(' · ')}</span>
                          <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-[#2D1E2F]/10 text-[#2D1E2F]">
                            Lv {offer.currentLevel} → {offer.nextLevel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Card Back Face (Shown rotated during 3D flip) */}
                  <div
                    aria-hidden="true"
                    className="backface-hidden rotate-y-180 absolute inset-0 rounded-xl sm:rounded-2xl border-3 sm:border-4 border-[#8C5A3C] bg-[#2D1E2F] p-2 flex items-center justify-center shadow-2xl pointer-events-none"
                  >
                    <TarotCardBackSvg />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Landscape Mobile Swipe Pagination Indicator Dots */}
        {offers.length > 1 && (
          <div className="hidden landscape:flex md:hidden items-center justify-center gap-2 mb-3">
            {offers.map((_, dotIdx) => (
              <button
                key={`swipe-dot-${dotIdx}`}
                type="button"
                aria-label={`Go to card ${dotIdx + 1}`}
                onClick={() => scrollToIndex(dotIdx)}
                className={`transition-all duration-200 rounded-full h-1.5 ${
                  dotIdx === activeSwipeIndex
                    ? 'w-6 bg-[#FDFFB6]'
                    : 'w-2 bg-[#FFFDF0]/30 hover:bg-[#FFFDF0]/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Reroll & Skip Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {freeRerollAvailable ? (
              <button
                type="button"
                disabled={isFlipping}
                onClick={() => triggerRerollWithFlip(onRerollFree)}
                className="btn-herbarium-lichen px-4 py-2 text-sm font-bold whitespace-nowrap shrink-0 min-h-[44px]"
              >
                Free Reroll (1 Left)
              </button>
            ) : canAdReroll ? (
              <button
                type="button"
                disabled={isFlipping}
                onClick={() => triggerRerollWithFlip(onRerollAd)}
                className="btn-herbarium-lichen px-4 py-2 text-sm font-bold whitespace-nowrap shrink-0 min-h-[44px]"
              >
                Watch Ad to Reroll
              </button>
            ) : null}

            <button
              type="button"
              disabled={coins < 40 || isFlipping}
              onClick={() => triggerRerollWithFlip(onRerollCoins)}
              className="btn-herbarium-secondary-compact px-4 py-2 text-sm font-semibold whitespace-nowrap shrink-0 min-h-[44px]"
            >
              Reroll (40 Coins)
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDebugCards && (
              <button
                type="button"
                onClick={onOpenDebugCards}
                className="btn-herbarium-secondary-compact px-3.5 py-2 text-sm font-bold whitespace-nowrap shrink-0 min-h-[44px] text-[#E8B64A]"
              >
                Debug Cards
              </button>
            )}
            <button
              type="button"
              onClick={onSkip}
              className="btn-herbarium-danger-compact px-4 py-2 text-sm font-semibold whitespace-nowrap shrink-0 min-h-[44px]"
            >
              Skip (+10 HP · +100 Score)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
