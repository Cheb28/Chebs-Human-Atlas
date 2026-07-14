// Yearly time-allocation activities (GAME_DESIGN section 4).
import { medianWage } from './countries.js';
import { disabilityBurden } from './health.js';
import { improveStudiedLanguage } from './language.js';
import { addCivicYear, addTrainingYear, ensureExperience } from './experience.js';

// Each activity: id, label, effect(ch, ctx) applying stat/skill deltas, and an
// available(ch, country) gate. Effects are the tunable balancing table.
export const ACTIVITIES = [
  { id: 'studying', label: 'Studying & Reading', desc: 'Academic performance, knowledge, and qualifications',
    effect: (ch) => { ch.education.performance=Math.min(100,(ch.education.performance??50)+(ch.education?.enrolled?4:2));if(ch.lifeState?.aptitudes)ch.lifeState.aptitudes.knowledgeYears=(ch.lifeState.aptitudes.knowledgeYears||0)+1; } },
  { id: 'gym', label: 'Gym / Sports', desc: 'Exercise, stamina, sleep, and long-term health',
    effect: () => {},
    available: (ch) => ch.location.kind === 'rural' || ch.wealthIdx >= 1 || (ch.money.cash + ch.money.bank) > 0 },
  { id: 'socializing', label: 'Socializing', desc: 'Relationships, belonging, and social experience', effect: () => {} },
  { id: 'activism', label: 'Political activism', desc: 'Civic experience, relationships, and possible legal exposure',
    effect: (ch) => { addCivicYear(ch); } },
  { id: 'religion', label: 'Religious practice', desc: 'Observance, community, and personal fulfillment', effect: () => {},
    available: (ch) => {
      const identity=ch.religionState?.privateIdentity||ch.religion;
      return identity && !/^(none|unaffiliated|atheist|agnostic)$/i.test(identity);
    } },
  { id: 'sidehustle', label: 'Side hustle', desc: '+Income, +Informal work experience',
    effect: (ch, ctx) => { ensureExperience(ch).sectors.informal+=1;ctx.sideIncome += medianWage(ctx.country) * (0.05 + ctx.rng.next() * 0.10); },
    available: (ch) => ch.age >= 14 },
  { id:'language', label:'Language study', desc:'+20 selected-language proficiency',
    effect:(ch)=>{improveStudiedLanguage(ch);}, available:(ch)=>ch.age>=6&&!!ch.languageStudyTarget },
  { id:'regional_work', label:'Specified regional work', desc:'Australian WHV renewal credit + income',
    effect:(ch,ctx)=>{const visa=ch.immigration?.residence?.visa;const months=(visa?.renewals||0)===0?3:6;visa.regionalWorkMonths=(visa.regionalWorkMonths||0)+months;ctx.sideIncome+=medianWage(ctx.country)*.35;},
    available:(ch,country)=>country.name==='Australia'&&ch.immigration?.residence?.visa?.kind==='working_holiday'&&(ch.immigration.residence.visa.renewals||0)<2 },
  { id: 'business', label: 'Business study', desc: '+Business preparation',
    effect: (ch) => { addTrainingYear(ch,'business'); },
    available: (ch) => ch.age >= 14 },
  { id: 'family', label: 'Family time', desc: 'Relationships, caregiving, and belonging', effect: () => {},
    available: (ch) => ch.spouse || (ch.family || []).some(p => p.relation === 'Child' && p.alive) },
  { id: 'rest', label: 'Rest / leisure', desc: 'Sleep, energy, stress recovery, and enjoyment', effect: () => {} },
];

export const ACTIVITY_BY_ID = Object.fromEntries(ACTIVITIES.map(a => [a.id, a]));

// Slot budget by situation (section 4).
export function slotBudget(ch) {
  if (ch.age < 6) return 0; // infants/toddlers: no activities yet, just growing up
  let slots;
  switch (ch.employmentStatus) {
    case 'child': slots=2; break;
    case 'student': slots=2; break;
    case 'employed': slots=ch.job&&ch.job.partTime?3:2; break;
    case 'informal': slots=3; break;
    case 'unemployed':
    case 'homemaker': slots=4; break;
    case 'retired': slots=3; break;
    case 'military': slots=1; break;
    case 'prison': slots=1; break;
    default: slots=3;
  }
  const healthTime = disabilityBurden(ch) >= 4 || (ch.health?.frailty || 0) >= 60 ? 1 : 0;
  const caregivingTime = ch.familyPlans?.caregivingId ? 1 : 0;
  return Math.max(0, slots - (ch.partTimeWork ? 1 : 0) - healthTime - caregivingTime);
}

export function availableActivities(ch, country) {
  if (ch.employmentStatus === 'prison') {
    const prisonActivities = new Set(['studying', 'gym', 'religion', 'rest']);
    return ACTIVITIES.filter(a => prisonActivities.has(a.id) && (!a.available || a.available(ch, country)));
  }
  return ACTIVITIES.filter(a => !a.available || a.available(ch, country));
}

// Keep the player's yearly routine until their situation actually invalidates it.
// If the slot budget shrinks, retain the earliest selected priorities; if it grows,
// leave the new slots empty so the player can choose how to use them.
export function reconcileActivities(ch, country) {
  const budget = slotBudget(ch);
  const available = new Set(availableActivities(ch, country).map(a => a.id));
  const next = [];
  for (let id of ch.selectedActivities || []) {
    if(id==='reading')id='studying';
    if (next.length >= budget) break;
    if (available.has(id) && !next.includes(id)) next.push(id);
  }
  ch.selectedActivities = next;
  return next;
}

// Apply the player's selected activities for the year. Unchecked slots -> Rest at half.
export function applyActivities(ch, country, rng, selectedIds) {
  const ctx = { country, rng, sideIncome: 0 };
  const budget = slotBudget(ch);
  const avail = new Set(availableActivities(ch, country).map(a => a.id));
  const chosen = (selectedIds || []).filter(id => avail.has(id)).slice(0, budget);
  for (const id of chosen) ACTIVITY_BY_ID[id].effect(ch, ctx);
  // idle slots -> Rest at half effect
  const idle = budget - chosen.length;
  // Empty slots become unstructured rest; the life-condition system converts
  // available time, sleep, and routines into energy and wellbeing.
  return ctx.sideIncome;
}
