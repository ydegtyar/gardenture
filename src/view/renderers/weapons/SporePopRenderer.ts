import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';

/**
 * Spore Pop Gas Cloud visual effect:
 * Billowing botanical spore puffs, curling gas tendrils, and rising spore bubbles.
 */
export function drawSporePopGasCloud(
  g: PIXI.Graphics,
  cx: number,
  cy: number,
  baseR: number,
  progress: number,
  fade: number,
  seedId: number,
  elapsedSeconds: number
): void {
  const baseRot = (seedId * 1.73) % (Math.PI * 2);
  const drift = elapsedSeconds * 1.4;

  // 1. Billowing multi-lobed organic gas puffs (no outer circle!)
  const puffCount = 7;
  for (let i = 0; i < puffCount; i++) {
    const a = baseRot + (i / puffCount) * Math.PI * 2 + Math.sin(drift + i) * 0.22;
    const radialBreath = 0.42 + 0.18 * Math.sin(elapsedSeconds * 2.8 + i * 1.7) + progress * 0.18;
    const dist = baseR * radialBreath;
    const px = cx + Math.cos(a) * dist;
    const py = cy + Math.sin(a) * (dist * 0.82) - progress * 5;
    const puffRx = baseR * (0.46 + (i % 3) * 0.08) * (0.85 + 0.15 * fade);
    const puffRy = puffRx * 0.78;
    const puffColor = i % 3 === 0 ? 0x10b981 : i % 3 === 1 ? PALETTE.MINT_GREEN : 0x84cc16;

    g.ellipse(px, py, puffRx, puffRy).fill({
      color: puffColor,
      alpha: 0.22 * fade,
    });
  }

  // 2. Central dense toxic-mint core mist
  for (let c = 0; c < 3; c++) {
    const ca = -drift * 1.2 + (c * Math.PI * 2) / 3;
    const cxOff = cx + Math.cos(ca) * (baseR * 0.22);
    const cyOff = cy + Math.sin(ca) * (baseR * 0.18);
    g.ellipse(cxOff, cyOff, baseR * 0.44, baseR * 0.34).fill({
      color: c === 0 ? 0xa3e635 : PALETTE.MINT_GREEN,
      alpha: 0.26 * fade,
    });
  }

  // 3. Swirling S-curved noxious spore vapor tendrils curling through the cloud
  const tendrilCount = 4;
  for (let t = 0; t < tendrilCount; t++) {
    const ta = baseRot + drift * 0.8 + (t * Math.PI) / 2;
    const cosA = Math.cos(ta);
    const sinA = Math.sin(ta);
    const perpX = -sinA;
    const perpY = cosA;
    const rIn = baseR * 0.15;
    const rOut = baseR * 0.82;
    const wave = baseR * 0.28 * (t % 2 === 0 ? 1 : -1);

    g.moveTo(cx + cosA * rIn, cy + sinA * rIn)
      .bezierCurveTo(
        cx + cosA * (baseR * 0.38) + perpX * wave,
        cy + sinA * (baseR * 0.38) + perpY * wave,
        cx + cosA * (baseR * 0.64) - perpX * wave * 0.7,
        cy + sinA * (baseR * 0.64) - perpY * wave * 0.7,
        cx + cosA * rOut,
        cy + sinA * rOut
      )
      .stroke({
        color: t % 2 === 0 ? PALETTE.MINT_GREEN : 0xd9f99d,
        width: 3.0 * fade,
        alpha: 0.55 * fade,
        cap: 'round',
      });
  }

  // 4. Floating luminescent spore bubbles & rising pollen motes
  const bubbleCount = 6;
  for (let b = 0; b < bubbleCount; b++) {
    const bCycle = (elapsedSeconds * 1.6 + seedId * 0.31 + b / bubbleCount) % 1;
    const bFade = Math.sin(bCycle * Math.PI) * fade;
    const ba = baseRot + (b / bubbleCount) * Math.PI * 2 + bCycle * 0.6;
    const br = baseR * (0.25 + (b % 3) * 0.22);
    const bx = cx + Math.cos(ba) * br;
    const by = cy + Math.sin(ba) * (br * 0.75) - bCycle * 14;
    const bRad = (2.8 + (b % 2) * 1.6) * (0.7 + 0.3 * fade);

    g.circle(bx, by, bRad)
      .fill({
        color: b % 2 === 0 ? 0xd9f99d : PALETTE.MINT_GREEN,
        alpha: 0.85 * bFade,
      })
      .stroke({
        color: 0x065f46,
        width: 1.2,
        alpha: 0.65 * bFade,
      });
  }
}
