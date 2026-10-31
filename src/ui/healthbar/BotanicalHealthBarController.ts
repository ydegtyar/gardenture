import {
  applyDamage,
  applyHeal,
  applySetLowHealth,
  applyShield,
  computeHealthBarView,
  createInitialHealthBarState,
  syncGhostToCurrentHp,
  type BotanicalHealthBarState,
  type BotanicalHealthBarView,
} from './healthBarLogic';

export interface BotanicalHealthBarListener {
  (state: BotanicalHealthBarState, view: BotanicalHealthBarView): void;
}

/**
 * Pure Vanilla JavaScript Controller for the AAA Botanical Health Bar (.hud-healthbar).
 * Manages CSS variables (--hp-pct, --ghost-pct, --shield-pct) and state/animation classes
 * (.has-shield, .shield-shatter, .is-damaged, .is-healing, .is-critical) directly on the DOM node.
 */
export class BotanicalHealthBarController {
  private containerEl: HTMLElement | null = null;
  private state: BotanicalHealthBarState;
  private listeners = new Set<BotanicalHealthBarListener>();

  private damageTimer: number | null = null;
  private healTimer: number | null = null;
  private shatterTimer: number | null = null;
  private ghostSyncTimer: number | null = null;
  private manualOverrideUntil = 0;

  constructor(maxHp = 100, initialHp = maxHp, initialShield = 0) {
    this.state = createInitialHealthBarState(maxHp, initialHp, initialShield);
  }

  public mount(containerEl: HTMLElement | null): void {
    this.containerEl = containerEl;
    if (containerEl) {
      this.renderToDom();
    }
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).healthBar = this;
    }
  }

  public destroy(): void {
    this.clearTimers();
    this.containerEl = null;
    this.listeners.clear();
  }

  public subscribe(listener: BotanicalHealthBarListener): () => void {
    this.listeners.add(listener);
    listener(this.state, computeHealthBarView(this.state));
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): BotanicalHealthBarState {
    return { ...this.state };
  }

  public getView(): BotanicalHealthBarView {
    return computeHealthBarView(this.state);
  }

  /**
   * JS Trigger Method 1: takeDamage(amount)
   * Absorbs shield first (triggering .shield-shatter for 300ms if shield drops to 0),
   * drops .hp-main-fill immediately while .hp-ghost-fill trails via CSS transition,
   * and triggers .is-damaged (heart-only pulse/recoil & flash, keeping the bar static).
   */
  public takeDamage(amount: number): void {
    this.manualOverrideUntil = Date.now() + 1500;
    const result = applyDamage(this.state, amount);
    this.state = result.nextState;
    this.syncToLiveSimulation();
    this.renderToDom();

    if (result.shieldShattered) {
      this.triggerShieldShatter();
    }

    if (result.hpDelta > 0 || result.shieldDelta > 0) {
      this.triggerDamage();
    }

    // Schedule ghost bar catch-up so CSS transition (width 0.6s ease-out 0.2s) animates smoothly
    if (this.ghostSyncTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.ghostSyncTimer);
    }
    if (typeof window !== 'undefined') {
      this.ghostSyncTimer = window.setTimeout(() => {
        this.state = syncGhostToCurrentHp(this.state);
        this.renderToDom();
      }, 30);
    } else {
      this.state = syncGhostToCurrentHp(this.state);
      this.renderToDom();
    }
  }

  /**
   * JS Trigger Method 2: heal(amount)
   * Smoothly increases .hp-main-fill width, sends a bright pulse wave across .hp-main-fill,
   * and triggers the 600ms double-thump heartbeat strictly on .heart-icon.
   */
  public heal(amount: number): void {
    this.manualOverrideUntil = Date.now() + 1500;
    const result = applyHeal(this.state, amount);
    this.state = result.nextState;
    this.syncToLiveSimulation();
    this.renderToDom();
    this.triggerHeal();
  }

  /**
   * JS Trigger Method 3: addShield(amount)
   * Adds crystalline shield points and activates .has-shield state.
   */
  public addShield(amount: number): void {
    this.manualOverrideUntil = Date.now() + 1500;
    const result = applyShield(this.state, amount);
    this.state = result.nextState;
    this.syncToLiveSimulation();
    if (this.state.shield > 0 && this.containerEl) {
      this.containerEl.classList.remove('shield-shatter');
    }
    this.renderToDom();
  }

  /**
   * JS Trigger Method 4: setLowHealth(bool)
   * Forces or clears the critical (< 25% HP) low health state (.is-critical).
   */
  public setLowHealth(isLow: boolean): void {
    this.manualOverrideUntil = Date.now() + 1500;
    this.state = applySetLowHealth(this.state, Boolean(isLow));
    this.syncToLiveSimulation();
    this.renderToDom();
  }

  public toggleLowHealth(): boolean {
    const currentlyCritical = computeHealthBarView(this.state).isCritical;
    this.setLowHealth(!currentlyCritical);
    return !currentlyCritical;
  }

  /**
   * Synchronize from live game simulation telemetry while preserving AAA transitions and animations.
   */
  public syncFromTelemetry(hp: number, maxHp: number, shield: number): void {
    if (
      Date.now() < this.manualOverrideUntil &&
      hp > 0 &&
      !(this.state.hp <= 1 && hp > this.state.hp)
    ) {
      return;
    }
    const safeMaxHp = Math.max(1, maxHp);
    const clampedHp = Math.max(0, Math.min(safeMaxHp, hp));
    const clampedShield = Math.max(0, Math.min(safeMaxHp, shield));

    const prevHp = this.state.hp;
    const prevShield = this.state.shield;
    const maxChanged = this.state.maxHp !== safeMaxHp;

    if (maxChanged) {
      this.state = {
        ...this.state,
        maxHp: safeMaxHp,
        maxShield: safeMaxHp,
        hp: clampedHp,
        ghostHp: clampedHp,
        shield: clampedShield,
      };
      this.renderToDom();
      return;
    }

    if (clampedHp === prevHp && clampedShield === prevShield) {
      return;
    }

    const shieldDroppedToZero = prevShield > 0 && clampedShield === 0;
    const tookDamage = clampedHp < prevHp || clampedShield < prevShield;
    const healed = clampedHp > prevHp;

    this.state = {
      ...this.state,
      hp: clampedHp,
      ghostHp: tookDamage ? Math.max(this.state.ghostHp, prevHp) : clampedHp,
      shield: clampedShield,
      forcedLowHealth:
        clampedHp / safeMaxHp < 0.25 ? this.state.forcedLowHealth : false,
    };

    this.renderToDom();

    if (shieldDroppedToZero) {
      this.triggerShieldShatter();
    }
    if (tookDamage) {
      this.triggerDamage();
      if (this.ghostSyncTimer !== null && typeof window !== 'undefined') {
        window.clearTimeout(this.ghostSyncTimer);
      }
      if (typeof window !== 'undefined') {
        this.ghostSyncTimer = window.setTimeout(() => {
          this.state = syncGhostToCurrentHp(this.state);
          this.renderToDom();
        }, 30);
      }
    } else if (healed) {
      this.triggerHeal();
    }
  }

  public triggerDamage(): void {
    const el = this.containerEl;
    if (!el) return;
    el.classList.remove('is-damaged', 'is-healing');
    void el.offsetWidth;
    el.classList.add('is-damaged');

    if (this.damageTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.damageTimer);
    }
    if (typeof window !== 'undefined') {
      this.damageTimer = window.setTimeout(() => {
        el.classList.remove('is-damaged');
      }, 260);
    }
  }

  public triggerHeal(): void {
    const el = this.containerEl;
    if (!el) return;
    el.classList.remove('is-healing', 'is-damaged');
    void el.offsetWidth;
    el.classList.add('is-healing');

    if (this.healTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.healTimer);
    }
    if (typeof window !== 'undefined') {
      this.healTimer = window.setTimeout(() => {
        el.classList.remove('is-healing');
      }, 620);
    }
  }

  public triggerShieldShatter(): void {
    const el = this.containerEl;
    if (!el) return;
    el.classList.remove('shield-shatter');
    void el.offsetWidth;
    el.classList.add('shield-shatter');

    if (this.shatterTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.shatterTimer);
    }
    if (typeof window !== 'undefined') {
      this.shatterTimer = window.setTimeout(() => {
        el.classList.remove('shield-shatter');
      }, 310);
    }
  }

  private renderToDom(): void {
    const view = computeHealthBarView(this.state);
    const el = this.containerEl;
    if (el) {
      el.style.setProperty('--hp-pct', `${view.hpPct}%`);
      el.style.setProperty('--ghost-pct', `${view.ghostPct}%`);
      el.style.setProperty('--shield-pct', `${view.shieldPct}%`);

      el.classList.toggle('has-shield', view.hasShield);
      el.classList.toggle('is-critical', view.isCritical);

      el.setAttribute('data-hp', String(Math.round(this.state.hp)));
      el.setAttribute('data-max-hp', String(Math.round(this.state.maxHp)));
      el.setAttribute('data-shield', String(Math.round(this.state.shield)));
      el.setAttribute('data-critical', String(view.isCritical));

      const shieldFill = el.querySelector<HTMLElement>('.shield-fill');
      if (shieldFill) {
        shieldFill.setAttribute('data-empty', String(!view.hasShield));
      }
    }

    for (const listener of this.listeners) {
      listener(this.state, view);
    }
  }

  private syncToLiveSimulation(): void {
    if (typeof window === 'undefined') return;
    const sim = (window as unknown as Record<string, unknown>).__BLOSSOM_SIM__ as
      | {
          currentHp: number;
          maxHp: number;
          shieldHp: number;
          shieldTimer: number;
        }
      | undefined;
    if (!sim) return;
    const ratio = this.state.hp / Math.max(1, this.state.maxHp);
    sim.currentHp = Math.max(1, Math.round(ratio * sim.maxHp));
    sim.shieldHp = Math.round(
      (this.state.shield / Math.max(1, this.state.maxShield)) * sim.maxHp
    );
    if (sim.shieldHp > 0) {
      sim.shieldTimer = Math.max(sim.shieldTimer ?? 0, 30);
    } else {
      sim.shieldTimer = 0;
    }
  }

  private clearTimers(): void {
    if (typeof window === 'undefined') return;
    if (this.damageTimer !== null) window.clearTimeout(this.damageTimer);
    if (this.healTimer !== null) window.clearTimeout(this.healTimer);
    if (this.shatterTimer !== null) window.clearTimeout(this.shatterTimer);
    if (this.ghostSyncTimer !== null) window.clearTimeout(this.ghostSyncTimer);
  }
}
