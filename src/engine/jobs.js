// Jobs & income (GAME_DESIGN section 6).
import { medianWage } from './countries.js';
import { genderRightsProfile, needsHusbandWorkApproval } from './genderRights.js';
import { healthWorkCapacity } from './health.js';
import { isIrregular } from './immigration.js';
import { workLanguageMultiplier } from './language.js';
import { recordPenalty } from './judicial.js';
import { relevantExperience, recordWorkYear, sectorYears, vocationalYears } from './experience.js';

// Sector ladders: each rung has title, wage multiplier vs median wage, and a
// gate(ch) predicate for reaching that rung.
export const SECTORS = {
  informal: {
    label: 'Informal / Agricultural',
    rungs: [
      { title: 'Laborer', mult: 0.4, gate: () => true },
      { title: 'Farmhand / Hawker', mult: 0.6, gate: (ch) => sectorYears(ch,'informal')>=2 },
      { title: 'Foreman', mult: 0.9, gate: (ch) => sectorYears(ch,'informal')>=5 },
    ],
  },
  service: {
    label: 'Service',
    rungs: [
      { title: 'Shop clerk', mult: 0.7, gate: (ch) => hasSecondary(ch) },
      { title: 'Office worker', mult: 1.0, gate: (ch) => hasSecondary(ch) && sectorYears(ch,'service')>=2 },
      { title: 'Manager', mult: 1.8, gate: (ch) => sectorYears(ch,'service')>=5 && ch.stats.charisma >= 50 },
      { title: 'Executive', mult: 3.5, gate: (ch) => sectorYears(ch,'service')>=10 && ch.experience.managementYears>=2 && ch.stats.charisma >= 65 },
    ],
  },
  industrial: {
    label: 'Industrial / Trades',
    rungs: [
      { title: 'Apprentice', mult: 0.6, gate: () => true },
      { title: 'Tradesman', mult: 1.1, gate: (ch) => vocationalYears(ch)>=3 },
      { title: 'Master / Site boss', mult: 2.0, gate: (ch) => vocationalYears(ch)>=7 },
    ],
  },
  professional: {
    label: 'Professional',
    rungs: [
      { title: 'Junior', mult: 1.5, gate: (ch) => ch.education.degree },
      { title: 'Senior', mult: 2.5, gate: (ch) => ch.education.degree && sectorYears(ch,'professional')>=4 },
      { title: 'Partner / Chief', mult: 5.0, gate: (ch) => ch.education.degree && sectorYears(ch,'professional')>=10 && ch.experience.managementYears>=2 && ch.stats.charisma >= 60 },
    ],
  },
};

function hasSecondary(ch) {
  return ['secondary_done', 'graduated'].includes(ch.education.stage) || ch.education.degree || ch.education.vocational;
}

export const RETIREMENT_AGE = 65;

// Which sectors can the player currently enter at the bottom rung?
export function eligibleSectors(ch) {
  if (ch.employmentStatus === 'prison') return [];
  const out = [];
  for (const [key, sec] of Object.entries(SECTORS)) {
    if (isIrregular(ch) && key !== 'informal') continue;
    const visa=ch.immigration?.residence?.visa;
    if(visa?.employerTied&&visa.employerSector&&key!==visa.employerSector)continue;
    if (sec.rungs[0].gate(ch)) out.push({ key, label: sec.label, entryTitle: sec.rungs[0].title });
  }
  // professional entry needs a degree; if not eligible it won't show
  return out;
}

// Annual gross wage for a job.
export function wageFor(country, job, ch = null) {
  if (!job) return 0;
  const sec = SECTORS[job.sector];
  const rung = sec.rungs[job.rung];
  const languageMult = workLanguageMultiplier(ch,country);
  return medianWage(country) * rung.mult * languageMult;
}

export function jobTitle(job) {
  if (!job) return null;
  return `${SECTORS[job.sector].rungs[job.rung].title} (${SECTORS[job.sector].label})`;
}

// Attempt to get hired into a sector at entry rung. Returns {hired, log}.
export function attemptHire(ch, country, sectorKey, rng, { firstJob = false } = {}) {
  const sec = SECTORS[sectorKey];
  if (isIrregular(ch) && sectorKey !== 'informal') return { hired: false, log: 'Without legal work status, only informal work is available.' };
  if (!sec || !sec.rungs[0].gate(ch)) return { hired: false, log: `Not qualified for ${sec ? sec.label : 'that sector'} yet.` };
  if (needsHusbandWorkApproval(ch, country)) return { hired: false, log: 'Your household’s legal restrictions prevented you from taking paid work.' };
  const unemp = (firstJob ? (country.youthUnemployment ?? country.unemployment * 2) : country.unemployment) / 100;
  const credentialBonus=(ch.education.degree?.12:ch.education.vocational?.08:hasSecondary(ch)?.04:0);
  const experienceMargin=Math.min(.35,relevantExperience(ch,sectorKey)*.035)+credentialBonus;
  const veteranBonus = ch.veteran ? 0.05 : 0;
  const demographicPenalty = demographicHiringPenalty(ch, country);
  const rightsMult = ch.sex === 'female' ? genderRightsProfile(country).femaleHireMult : 1;
  const capacity = healthWorkCapacity(ch, sectorKey);
  const accommodation = country.lawTier === 'strong' ? 0.35 : country.lawTier === 'medium' ? 0.65 : 1;
  const healthMult = Math.max(0.35, 1 - (1 - capacity) * accommodation);
  const criminalPenalty = recordPenalty(ch, sectorKey);
  const p = Math.max(0.03, Math.min(0.95, (0.70 - unemp + experienceMargin + veteranBonus - demographicPenalty - criminalPenalty) * rightsMult * healthMult));
  if (rng.chance(p)) {
    ch.job = { sector: sectorKey, rung: 0, yearsAtRung: 0 };
    ch.employmentStatus = sectorKey === 'informal' ? 'informal' : 'employed';
    const visa=ch.immigration?.residence?.visa;
    if(visa?.employerTied&&!visa.employerSector)visa.employerSector=sectorKey;
    return { hired: true, log: `Hired as ${sec.rungs[0].title} (${sec.label}).` };
  }
  return { hired: false, log: `Job search unsuccessful this year.` };
}

// Keep the design's discrimination effect subtle: at most five percentage
// points when a known ethnicity or religion is a small local minority.
function demographicHiringPenalty(ch, country) {
  const minority = (list, value) => {
    const match = (list || []).find(x => x.name === value);
    return match && match.pct < 10 ? 0.025 : 0;
  };
  return Math.min(0.05, minority(country.ethnicGroups, ch.ethnicity) + minority(country.religions, ch.religion));
}

// Yearly on-the-job resolution: promotion, layoff. Returns log lines.
export function resolveEmployment(ch, country, rng, { layoffMult = 1 } = {}) {
  const log = [];
  const job = ch.job;
  if (!job) return log;
  job.yearsAtRung += 1;
  recordWorkYear(ch,job.sector,job.rung);
  const capacity = healthWorkCapacity(ch, job.sector);

  if (capacity < 0.45 && rng.chance((0.45 - capacity) * 0.35)) {
    ch.benefits.lastWage = wageFor(country, job, ch);
    ch.job = null;
    ch.employmentStatus = 'unemployed';
    ch.benefits.unemploymentYearsLeft = -1;
    log.push(`Health limitations forced you to leave ${SECTORS[job.sector].rungs[job.rung].title}.`);
    return log;
  }

  // Layoff (3%/yr; doubled during a recession).
  if (rng.chance(0.03 * layoffMult)) {
    ch.benefits = ch.benefits || {};
    ch.benefits.lastWage = wageFor(country, job, ch);
    ch.job = null;
    ch.employmentStatus = 'unemployed';
    ch.benefits.unemploymentYearsLeft = -1; // set on next-year situation
    log.push(`Laid off from ${SECTORS[job.sector].rungs[job.rung].title}.`);
    return log;
  }

  // Promotion if next rung's gate is met.
  const sec = SECTORS[job.sector];
  const next = sec.rungs[job.rung + 1];
  if(ch.immigration?.residence?.visa?.temporaryJobsOnly)return log;
  if (next && next.gate(ch)) {
    const p = Math.max(0.02, (0.20 + ch.stats.charisma / 200 - recordPenalty(ch, job.sector) * 0.5) * Math.max(0.5, capacity));
    if (rng.chance(p)) {
      job.rung += 1; job.yearsAtRung = 0;
      log.push(`Promoted to ${next.title}.`);
    }
  }
  return log;
}
