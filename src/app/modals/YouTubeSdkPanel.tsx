/**
 * @file YouTubeSdkPanel.tsx
 * @llm-tag component:youtube-sdk-panel
 * @llm-context YouTube Playables SDK dev stubs & diagnostics panel.
 * @llm-description Displays Playables environment status, ad tokens, cloud payload info, ad trigger/reconcile actions, and dev stub controls in development mode.
 */

import React from 'react';
import { useGameShell } from '../context/GameShellContext';
import { LazyYouTubeDevStubControls } from '../debug/LazyDebugComponents';
import { IS_DEV } from '../debug/devGate';

export interface Props {
  className?: string;
}

export const YouTubeSdkPanel: React.FC<Props> = ({ className = '' }) => {
  if (!IS_DEV) return null;

  const {
    saveData,
    ytDiagnostics,
    ytSdkBanner,
    lastSyncSource,
    isAdLoading,
    handleWatchSanctuaryRewardAd,
    handleSavePlayerStateNow,
    handleReloadAndReconcileSave,
    handleSetDevAdOutcomeMode,
    handleSetDevCloudStorageMode,
    handleSimulateYtAudioToggle,
    handleSyncScoreNow,
  } = useGameShell();

  if (!ytDiagnostics) return null;

  const { currencies } = saveData;
  const statusBannerText = ytSdkBanner ?? null;

  return (
    <div
      data-testid="yt-sdk-panel"
      className={`p-3.5 rounded-xl bg-[#1E1520] border-2 border-[#A8E6CF]/45 space-y-3 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#A8E6CF] uppercase tracking-wider">
              YouTube Playables SDK · Ad Rewards, Cloud Save & Dev Stubs
            </span>
            <span
              data-testid="yt-sdk-env-badge"
              className={`px-2 py-0.5 rounded text-[10px] font-mono-tabular font-bold ${
                ytDiagnostics.isPlayablesEnv
                  ? 'bg-[#A8E6CF] text-[#2D1E2F]'
                  : 'bg-[#DED2F9] text-[#2D1E2F]'
              }`}
            >
              {ytDiagnostics.isPlayablesEnv
                ? `YT Host (${ytDiagnostics.sdkVersion})`
                : `Dev Mode Stub (${ytDiagnostics.sdkVersion})`}
            </span>
          </div>
          <div className="text-[11px] text-[#FFFDF0]/75 mt-0.5 font-mono-tabular">
            Ads Today: {currencies.adWatchCountToday}/6 · Ad Tokens: {currencies.adTokensToday} · Cloud Payload: {ytDiagnostics.lastSavedCloudBytes} / 16,384 B · Sync: {lastSyncSource.toUpperCase()}
            {ytDiagnostics.lastSubmittedScore !== null &&
              ` · Synced Score: ${ytDiagnostics.lastSubmittedScore}`}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {handleWatchSanctuaryRewardAd && (
            <button
              type="button"
              data-testid="watch-sanctuary-reward-ad"
              disabled={isAdLoading}
              onClick={handleWatchSanctuaryRewardAd}
              className="btn-herbarium-lichen px-3 py-1.5 text-xs whitespace-nowrap min-h-[38px]"
            >
              {isAdLoading ? 'Playing Ad...' : 'Watch Ad (+120 Coins & +2 Seeds)'}
            </button>
          )}
          {handleSavePlayerStateNow && (
            <button
              type="button"
              data-testid="yt-sdk-save-now-btn"
              onClick={handleSavePlayerStateNow}
              className="btn-herbarium-secondary-compact px-2.5 py-1.5 text-xs whitespace-nowrap min-h-[38px] text-[#A8E6CF]"
            >
              Save Player State
            </button>
          )}
          {handleReloadAndReconcileSave && (
            <button
              type="button"
              data-testid="yt-sdk-load-cloud-btn"
              onClick={handleReloadAndReconcileSave}
              className="btn-herbarium-secondary-compact px-2.5 py-1.5 text-xs whitespace-nowrap min-h-[38px]"
            >
              Load & Reconcile Save
            </button>
          )}
        </div>
      </div>

      {/* Dev Mode Stub Controls */}
      <LazyYouTubeDevStubControls
        ytDiagnostics={ytDiagnostics}
        onSetDevAdOutcomeMode={handleSetDevAdOutcomeMode}
        onSetDevCloudStorageMode={handleSetDevCloudStorageMode}
        onSimulateYtAudioToggle={handleSimulateYtAudioToggle}
        onSyncScoreNow={handleSyncScoreNow}
      />

      {statusBannerText && (
        <div
          data-testid="yt-sdk-status-banner"
          className="px-3 py-1.5 rounded-lg bg-[#2B1F2D] border border-[#FDFFB6]/50 text-[11px] font-mono-tabular font-bold text-[#FDFFB6]"
        >
          {statusBannerText}
        </div>
      )}
    </div>
  );
};

export default YouTubeSdkPanel;
