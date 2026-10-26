import React, { Suspense } from 'react';
import type {
  DevStubAdOutcomeMode,
  DevStubStorageMode,
  YtSdkDiagnosticsState,
} from '../../platform/ports/PlatformFacade';
import type { DebugCardModalProps } from './DebugTools';
import { IS_DEV } from './devGate';

const LazyDebugCardModalInner = IS_DEV
  ? React.lazy(() =>
      import('./DebugTools').then((m) => ({ default: m.DebugCardModal }))
    )
  : null;

const LazyHudDebugButtonInner = IS_DEV
  ? React.lazy(() =>
      import('./DebugTools').then((m) => ({ default: m.HudDebugButton }))
    )
  : null;

const LazyModalDebugCardsButtonInner = IS_DEV
  ? React.lazy(() =>
      import('./DebugTools').then((m) => ({ default: m.ModalDebugCardsButton }))
    )
  : null;

const LazySanctuaryHeaderDebugGoldButtonInner = IS_DEV
  ? React.lazy(() =>
      import('./DebugTools').then((m) => ({
        default: m.SanctuaryHeaderDebugGoldButton,
      }))
    )
  : null;

const LazyStoreDebugTreasuryPanelInner = IS_DEV
  ? React.lazy(() =>
      import('./DebugTools').then((m) => ({ default: m.StoreDebugTreasuryPanel }))
    )
  : null;

const LazyPersonaDebugAllButtonInner = IS_DEV
  ? React.lazy(() =>
      import('./DebugTools').then((m) => ({ default: m.PersonaDebugAllButton }))
    )
  : null;

const LazyPersonaDebugSingleButtonInner = IS_DEV
  ? React.lazy(() =>
      import('./DebugTools').then((m) => ({
        default: m.PersonaDebugSingleButton,
      }))
    )
  : null;

const LazyYouTubeDevStubControlsInner = IS_DEV
  ? React.lazy(() =>
      import('./DebugTools').then((m) => ({
        default: m.YouTubeDevStubControls,
      }))
    )
  : null;

const LazyBestiaryEnemyDebugBadgeInner = IS_DEV
  ? React.lazy(() =>
      import('./DebugTools').then((m) => ({
        default: m.BestiaryEnemyDebugBadge,
      }))
    )
  : null;

const LazyBestiaryEnemyDebugSpawnerInner = IS_DEV
  ? React.lazy(() =>
      import('./DebugTools').then((m) => ({
        default: m.BestiaryEnemyDebugSpawner,
      }))
    )
  : null;

export function LazyDebugCardModal(props: DebugCardModalProps) {
  if (!IS_DEV || !LazyDebugCardModalInner) return null;
  return (
    <Suspense fallback={null}>
      <LazyDebugCardModalInner {...props} />
    </Suspense>
  );
}

export function LazyHudDebugButton(props: { onOpen: () => void }) {
  if (!IS_DEV || !LazyHudDebugButtonInner) return null;
  return (
    <Suspense fallback={null}>
      <LazyHudDebugButtonInner {...props} />
    </Suspense>
  );
}

export function LazyModalDebugCardsButton(props: {
  onOpen: () => void;
  variant?: 'draft' | 'pause';
}) {
  if (!IS_DEV || !LazyModalDebugCardsButtonInner) return null;
  return (
    <Suspense fallback={null}>
      <LazyModalDebugCardsButtonInner {...props} />
    </Suspense>
  );
}

export function LazySanctuaryHeaderDebugGoldButton(props: {
  onAddDebugGold: (amount: number) => void;
}) {
  if (!IS_DEV || !LazySanctuaryHeaderDebugGoldButtonInner) return null;
  return (
    <Suspense fallback={null}>
      <LazySanctuaryHeaderDebugGoldButtonInner {...props} />
    </Suspense>
  );
}

export function LazyStoreDebugTreasuryPanel(props: {
  onAddDebugGold: (amount: number) => void;
}) {
  if (!IS_DEV || !LazyStoreDebugTreasuryPanelInner) return null;
  return (
    <Suspense fallback={null}>
      <LazyStoreDebugTreasuryPanelInner {...props} />
    </Suspense>
  );
}

export function LazyPersonaDebugAllButton(props: {
  onIncrementAllPersonaAdPips: () => void;
}) {
  if (!IS_DEV || !LazyPersonaDebugAllButtonInner) return null;
  return (
    <Suspense fallback={null}>
      <LazyPersonaDebugAllButtonInner {...props} />
    </Suspense>
  );
}

export function LazyPersonaDebugSingleButton(props: {
  personaId: string;
  onIncrementPersonaAdPip: (personaId: string) => void;
}) {
  if (!IS_DEV || !LazyPersonaDebugSingleButtonInner) return null;
  return (
    <Suspense fallback={null}>
      <LazyPersonaDebugSingleButtonInner {...props} />
    </Suspense>
  );
}

export function LazyYouTubeDevStubControls(props: {
  ytDiagnostics: YtSdkDiagnosticsState;
  onSetDevAdOutcomeMode?: (mode: DevStubAdOutcomeMode) => void;
  onSetDevCloudStorageMode?: (mode: DevStubStorageMode) => void;
  onSimulateYtAudioToggle?: () => void;
  onSyncScoreNow?: () => void;
}) {
  if (!IS_DEV || !LazyYouTubeDevStubControlsInner) return null;
  return (
    <Suspense fallback={null}>
      <LazyYouTubeDevStubControlsInner {...props} />
    </Suspense>
  );
}

export function LazyBestiaryEnemyDebugBadge(props: {
  enemyKey: string;
  isHighlighted: boolean;
  onToggle: () => void;
}) {
  if (!IS_DEV || !LazyBestiaryEnemyDebugBadgeInner) return null;
  return (
    <Suspense fallback={null}>
      <LazyBestiaryEnemyDebugBadgeInner {...props} />
    </Suspense>
  );
}

export function LazyBestiaryEnemyDebugSpawner(props: {
  enemyKey: string;
  isHighlighted: boolean;
  onSpawnBestiaryEnemy: (
    bestiaryKey: string,
    mode: 'infinite_hp' | 'swarm' | 'respawn_on_death'
  ) => void;
}) {
  if (!IS_DEV || !LazyBestiaryEnemyDebugSpawnerInner) return null;
  return (
    <Suspense fallback={null}>
      <LazyBestiaryEnemyDebugSpawnerInner {...props} />
    </Suspense>
  );
}
