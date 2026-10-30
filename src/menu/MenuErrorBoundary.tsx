/**
 * @file MenuErrorBoundary.tsx
 * Failure containment for the isolated MenuScene renderer (Rule 9).
 * If WebGL context creation fails, the context is lost, or an error is thrown,
 * falls back to a static CSS twilight gradient + CSS-animated sakura petals
 * while keeping the HTML Menu UI interactive and never throwing into the game.
 */

import React from 'react';

export const MenuCssFallbackBackdrop: React.FC<{ reason?: string | null }> = ({
  reason,
}) => {
  const petals = [
    { left: '12%', top: '22%', size: 22, delay: '0s', duration: '9s' },
    { left: '28%', top: '16%', size: 18, delay: '1.2s', duration: '11s' },
    { left: '76%', top: '24%', size: 24, delay: '0.6s', duration: '10s' },
    { left: '84%', top: '58%', size: 20, delay: '2.1s', duration: '12s' },
    { left: '18%', top: '68%', size: 26, delay: '1.5s', duration: '10.5s' },
    { left: '64%', top: '74%', size: 16, delay: '0.9s', duration: '9.5s' },
  ];

  return (
    <div
      data-testid="menu-css-fallback"
      data-fallback-reason={reason ?? 'fallback'}
      className="absolute inset-0 overflow-hidden pointer-events-none select-none bg-gradient-to-b from-[#23152E] via-[#1B1024] to-[#120A18]"
      aria-hidden="true"
    >
      {/* Ambient twilight radial glow */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(74, 42, 94, 0.55) 0%, transparent 68%)',
        }}
      />
      {/* CSS-animated drifting sakura petals */}
      {petals.map((p, idx) => (
        <span
          key={idx}
          className="absolute rounded-full bg-[#F48DA0]/65 shadow-[0_0_12px_rgba(244,141,160,0.45)] animate-pulse"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
};

interface MenuErrorBoundaryProps {
  children: React.ReactNode;
  fallbackUI?: React.ReactNode;
}

interface MenuErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class MenuErrorBoundary extends React.Component<
  MenuErrorBoundaryProps,
  MenuErrorBoundaryState
> {
  constructor(props: MenuErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: unknown): MenuErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'Menu scene error',
    };
  }

  componentDidCatch(error: unknown): void {
    console.warn('[MenuErrorBoundary] Contained menu scene error:', error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-20">
          <MenuCssFallbackBackdrop reason={this.state.errorMessage} />
          {this.props.fallbackUI}
        </div>
      );
    }
    return this.props.children;
  }
}
