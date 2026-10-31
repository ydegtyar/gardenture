import type { PersonaDef, ProfessionId } from '../../../content/schema/types';

export const PERSONAS: PersonaDef[] = [
  {
    id: 'warden_zagreus_naruto',
    professionId: 'warden',
    name: 'Losti Seige',
    subtitle: 'Ashen Cinder-Warden of the Sunken Bastion',
    popCultureMashup: 'Ancient Cinder-Bastion Exile · Dual-Soul Sentinel',
    permanentVfxLabel: 'Smoldering Cinder Footsteps & Dual-Soul Gaze',
    permanentVfxDescription:
      'Walks the overgrown ruins in charred bastion plate and an ember-woven mantle, leaving compact smoldering cinder footprints that fade behind his boots while his crimson-and-jade dual-soul eyes pierce the mist.',
    stepEffectKind: 'zagreus_fire_step',
    eyeLeftColor: 0xf43f5e,
    eyeRightColor: 0x22c55e,
    bodyColor: 0xffedd5,
    cloakColor: 0xf97316,
    accentColor: 0xf43f5e,
    unlockCostSeeds: 0,
    adPipsRequired: 3,
  },
  {
    id: 'seeker_hollow_levi',
    professionId: 'seeker',
    name: 'Vessel Ackerman',
    subtitle: 'Abyssal Wings of Freedom (Seeker Skin)',
    popCultureMashup: 'Pure Vessel / The Knight (Hollow Knight) × Levi Ackerman (Attack on Titan)',
    permanentVfxLabel: 'Disappearing Void-Shade Steps & ODM Steam Vortex',
    permanentVfxDescription:
      'Leaves vanishing Abyssal Void footprints and pressurized ODM grapnel steam rings behind Seeker, with a horned porcelain Hollow mask, Survey Corps emerald cloak, and dual Pure-Nail steel blades.',
    stepEffectKind: 'void_soul_step',
    eyeLeftColor: 0x0f172a,
    eyeRightColor: 0x38bdf8,
    bodyColor: 0xf8fafc,
    cloakColor: 0x15803d,
    accentColor: 0x38bdf8,
    unlockCostSeeds: 0,
    adPipsRequired: 3,
  },
  {
    id: 'herbalist_frieren_strange',
    professionId: 'herbalist',
    name: 'Hiten Jade',
    subtitle: 'Mist-Spring Dew Weaver of the Jade Sanctuary',
    popCultureMashup: 'Mist-Spring Sovereign · Living Dew Mystic',
    permanentVfxLabel: 'Coiling Diamond-Green & Ice-Blue Water Vapor Aura',
    permanentVfxDescription:
      'Wreathed in an animated, thick, wispy diamond-green and glacier-blue water vapor aura with orbiting diamond condensation facets and rising mist plumes that coil continuously around her frost-trimmed cerulean vestments, blossom-pink tresses, luminous sapphire-blue eyes, and the sacred jade rhombus seal between her eyes.',
    stepEffectKind: 'alchemy_rune_step',
    eyeLeftColor: 0x0284c7,
    eyeRightColor: 0x0284c7,
    bodyColor: 0xf472b6,
    cloakColor: 0x0284c7,
    accentColor: 0x38bdf8,
    unlockCostSeeds: 0,
    adPipsRequired: 3,
  },
  {
    id: 'stormcaller_gojo_killua',
    professionId: 'stormcaller',
    name: 'Thander Rein',
    subtitle: 'Elder Thunder-God · Crimson Tempest Cloak',
    popCultureMashup: 'Elder Thunder-God × Crimson Storm Sovereign',
    permanentVfxLabel: 'Levitating Thunder-God Flight & Lightning Eye Trails',
    permanentVfxDescription:
      'Levitates above the battlefield wearing an iconic conical bamboo hat and flowing crimson tempest cloak while blazing lightning eyes stream electric light trails on movement.',
    stepEffectKind: 'godspeed_lightning_step',
    eyeLeftColor: 0x38bdf8,
    eyeRightColor: 0x38bdf8,
    bodyColor: 0x1e293b,
    cloakColor: 0xdc2626,
    accentColor: 0x38bdf8,
    unlockCostSeeds: 0,
    adPipsRequired: 3,
  },
];

/**
 * Authoritative map linking each Arcana Persona ID strictly to its related hero/profession:
 * - warden: Losti Seige (warden_zagreus_naruto)
 * - seeker: Vessel Ackerman (seeker_hollow_levi)
 * - herbalist: Hiten Jade (herbalist_frieren_strange)
 * - stormcaller: Thander Rein (stormcaller_gojo_killua)
 */
export const PERSONA_HERO_MAP: Record<string, ProfessionId> = {
  warden_zagreus_naruto: 'warden',
  seeker_hollow_levi: 'seeker',
  herbalist_frieren_strange: 'herbalist',
  stormcaller_gojo_killua: 'stormcaller',
};

/**
 * Checks whether a persona ID belongs to the specified hero/profession.
 * Guarantees that personas and their skins/auras are strictly applied
 * only to their related hero.
 */
export function isPersonaRelatedToProfession(
  personaId: string | null | undefined,
  professionId: ProfessionId
): boolean {
  if (!personaId || personaId === 'adventurer_default') return false;
  if (PERSONA_HERO_MAP[personaId]) {
    return PERSONA_HERO_MAP[personaId] === professionId;
  }
  const def = PERSONAS.find((p) => p.id === personaId);
  return def ? def.professionId === professionId : false;
}
