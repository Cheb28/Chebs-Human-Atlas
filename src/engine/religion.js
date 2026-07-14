import { medianWage } from './countries.js';

const NONE = /^(none|unaffiliated|atheist|agnostic|no religion|not religious|unspecified)$/i;

export const RELIGIOUS_COMMITMENTS = [
  { id: 'worship', label: 'Regular worship or prayer', description: 'Maintain your usual worship or prayer practice.' },
  { id: 'fasting', label: 'Religious fasting', description: 'Observe the fasting periods expected in your tradition.' },
  { id: 'study', label: 'Religious study', description: 'Continue studying your beliefs and tradition.' },
  { id: 'dietary', label: 'Dietary practice', description: 'Continue the dietary practices you have chosen.' },
  { id: 'community', label: 'Community participation', description: 'Remain involved with a congregation or religious community.' },
  { id: 'reconciliation', label: 'Regular reconciliation practice', description: 'Maintain confession, repentance, reflection, or another applicable practice.' },
];

export const CHARITY_PURPOSES = [
  'Poverty relief', 'Healthcare', 'Education', 'Disaster relief', 'Refugees',
  'Religious community', 'Local community projects', 'Other charity',
];

export const PRIVATE_BELIEFS = {
  aligned: 'Believes in public religion', questioning: 'Questioning or uncertain',
  different: 'Privately follows another belief', unaffiliated: 'Privately unaffiliated',
};

export function isReligiousIdentity(value) {
  return !!value && !NONE.test(String(value).trim());
}

export function traditionFor(value) {
  const religion = String(value || 'None');
  if (/muslim|islam|bektashi/i.test(religion)) return 'Islam';
  if (/catholic|christ|protestant|orthodox|anglican|pentecostal|apostolic|baptist|lutheran|methodist|presbyterian|mormon|witness/i.test(religion)) return 'Christianity';
  if (/jew/i.test(religion)) return 'Judaism';
  if (/hindu/i.test(religion)) return 'Hinduism';
  if (/buddh/i.test(religion)) return 'Buddhism';
  if (/sikh/i.test(religion)) return 'Sikhism';
  if (/traditional|folk|indigenous|animis/i.test(religion)) return 'Traditional or folk religion';
  return isReligiousIdentity(religion) ? 'Other religion' : 'No religion';
}

function initialBranch(identity, tradition) {
  if (tradition === 'Christianity') {
    if (/catholic/i.test(identity)) return 'Catholic';
    if (/orthodox/i.test(identity)) return 'Eastern Orthodox';
    if (/protestant|anglican|pentecostal|apostolic|baptist|lutheran|methodist|presbyterian/i.test(identity)) return identity;
  }
  return 'Not specified';
}

export function branchOptions(tradition) {
  if (tradition === 'Christianity') return ['Not specified', 'Catholic', 'Eastern Orthodox', 'Protestant', 'Other Christian tradition'];
  if (tradition === 'Islam') return ['Not specified', 'Sunni', 'Shia', 'Ibadi', 'Other Muslim tradition'];
  if (tradition === 'Judaism') return ['Not specified', 'Orthodox', 'Conservative', 'Reform', 'Other Jewish tradition'];
  if (tradition === 'Buddhism') return ['Not specified', 'Theravada', 'Mahayana', 'Vajrayana', 'Other Buddhist tradition'];
  return ['Not specified', 'Family or local tradition', 'Other tradition'];
}

export const FIQH_OPTIONS = ['Not specified', 'Hanafi', 'Maliki', "Shafi'i", 'Hanbali', "Ja'fari", 'Other school'];

export function initReligionState(ch) {
  const publicIdentity = ch.religion || 'None';
  const tradition = traditionFor(publicIdentity);
  return {
    publicIdentity,
    privateIdentity: publicIdentity,
    privateBelief: isReligiousIdentity(publicIdentity) ? 'aligned' : 'unaffiliated',
    tradition,
    branch: initialBranch(publicIdentity, tradition),
    fiqhSchool: tradition === 'Islam' ? 'Not specified' : null,
    observanceScore: isReligiousIdentity(publicIdentity) ? 35 : 0,
    pietyScore: isReligiousIdentity(publicIdentity) ? 35 : 0,
    commitments: Object.fromEntries(RELIGIOUS_COMMITMENTS.map(x => [x.id, false])),
    annualHistory: [],
    changes: [],
    upbringing: { guardianReligion: publicIdentity, guardianLed: true, autonomyAge: 16 },
    community: { member: false, standing: 50, history: [] },
    charity: { enabled: false, mode: 'fixed', amount: 0, percent: 2.5, purpose: 'Poverty relief', source: 'personal', history: [], lifetimeGiven: 0 },
    pilgrimage: { planned: false, completed: false, completedAge: null, history: [] },
    conduct: [],
    career: { interested: false, path: 'Community religious leader', preparationYears: 0, history: [] },
  };
}

export function ensureReligionState(ch) {
  ch.religionState ||= initReligionState(ch);
  const r = ch.religionState;
  r.publicIdentity ||= ch.religion || 'None';
  r.privateIdentity ||= r.publicIdentity;
  r.privateBelief ||= isReligiousIdentity(r.privateIdentity) ? 'aligned' : 'unaffiliated';
  r.tradition ||= traditionFor(r.publicIdentity);
  r.branch ||= initialBranch(r.publicIdentity, r.tradition);
  r.fiqhSchool = r.tradition === 'Islam' ? (r.fiqhSchool || 'Not specified') : null;
  r.observanceScore ??= isReligiousIdentity(r.publicIdentity) ? 35 : 0;
  r.pietyScore ??= isReligiousIdentity(r.privateIdentity) ? 35 : 0;
  r.commitments ||= {};
  for (const item of RELIGIOUS_COMMITMENTS) r.commitments[item.id] ??= false;
  r.annualHistory ||= [];
  r.changes ||= [];
  r.upbringing ||= { guardianReligion: r.publicIdentity, guardianLed: ch.age < 16, autonomyAge: 16 };
  r.community ||= { member: false, standing: 50, history: [] };
  r.community.history ||= [];
  r.charity ||= { enabled: false, mode: 'fixed', amount: 0, percent: 2.5, purpose: 'Poverty relief', source: 'personal', history: [], lifetimeGiven: 0 };
  r.charity.history ||= []; r.charity.lifetimeGiven ??= 0;
  r.pilgrimage ||= { planned: false, completed: false, completedAge: null, history: [] };
  r.pilgrimage.history ||= [];
  r.conduct ||= [];
  r.career ||= { interested: false, path: 'Community religious leader', preparationYears: 0, history: [] };
  if (ch.age >= (r.upbringing.autonomyAge || 16)) r.upbringing.guardianLed = false;
  ch.religion = r.publicIdentity;
  return r;
}

export function observanceLabel(ch) {
  const r = ensureReligionState(ch);
  if ((ch.age || 0) < (r.upbringing.autonomyAge || 16)) return 'Guardian-led upbringing';
  const score = r.observanceScore || 0;
  return score >= 80 ? 'Devout' : score >= 58 ? 'Observant' : score >= 30 ? 'Occasional' : 'Non-practicing';
}

export function pietyLabel(ch) {
  const r = ensureReligionState(ch), score = r.pietyScore || 0;
  if ((ch.age || 0) < (r.upbringing.autonomyAge || 16)) return 'Still developing';
  if (!isReligiousIdentity(r.privateIdentity)) return 'Not personally religious';
  return score >= 80 ? 'Deeply devout' : score >= 58 ? 'Devout' : score >= 30 ? 'Personally believing' : 'Loosely attached';
}

export function setReligionCommitment(ch, id, enabled) {
  const r = ensureReligionState(ch);
  if (!RELIGIOUS_COMMITMENTS.some(x => x.id === id)) return false;
  r.commitments[id] = !!enabled;
  return true;
}

export function updateCharityPlan(ch, patch) {
  const plan = ensureReligionState(ch).charity;
  if (patch.enabled != null) plan.enabled = !!patch.enabled;
  if (['fixed', 'percent'].includes(patch.mode)) plan.mode = patch.mode;
  if (patch.amount != null) plan.amount = Math.max(0, Number(patch.amount) || 0);
  if (patch.percent != null) plan.percent = Math.max(0, Math.min(100, Number(patch.percent) || 0));
  if (CHARITY_PURPOSES.includes(patch.purpose)) plan.purpose = patch.purpose;
  if (['personal', 'household'].includes(patch.source)) plan.source = patch.source;
  return true;
}

export function setPrivateBelief(ch, belief, privateIdentity) {
  const r = ensureReligionState(ch);
  if (!PRIVATE_BELIEFS[belief]) return false;
  if (belief === 'different' && !isReligiousIdentity(privateIdentity)) belief = 'unaffiliated';
  r.privateBelief = belief;
  if (belief === 'aligned') r.privateIdentity = r.publicIdentity;
  else if (belief === 'unaffiliated') r.privateIdentity = 'None';
  else if (belief === 'different' && privateIdentity) r.privateIdentity = privateIdentity;
  r.changes.push({ age: ch.age, type: 'private belief', value: PRIVATE_BELIEFS[belief] });
  return true;
}

export function changePublicReligion(ch, target) {
  const r = ensureReligionState(ch), next = target || 'None', previous = r.publicIdentity;
  if (previous === next || ch.age < (r.upbringing.autonomyAge || 16)) return false;
  r.publicIdentity = next; ch.religion = next; r.tradition = traditionFor(next);
  r.branch = initialBranch(next, r.tradition); r.fiqhSchool = r.tradition === 'Islam' ? 'Not specified' : null;
  if (r.privateBelief === 'aligned') r.privateIdentity = next;
  r.changes.push({ age: ch.age, type: isReligiousIdentity(next) ? 'public conversion or affiliation' : 'public departure', from: previous, value: next });
  r.community.standing = Math.max(0, r.community.standing - 5);
  for (const person of ch.family || []) if (person.alive && person.religion === previous) person.relationshipScore = Math.max(0, (person.relationshipScore ?? 50) - 2);
  return true;
}

export function setReligiousBranch(ch, branch, fiqhSchool) {
  const r = ensureReligionState(ch);
  if (branchOptions(r.tradition).includes(branch)) r.branch = branch;
  if (r.tradition === 'Islam' && FIQH_OPTIONS.includes(fiqhSchool)) r.fiqhSchool = fiqhSchool;
  return true;
}

export function setReligiousCommunity(ch, member) {
  const r = ensureReligionState(ch); r.community.member = !!member;
  r.community.history.push({ age: ch.age, member: r.community.member });
  return true;
}

export function planLifetimePilgrimage(ch) {
  const r = ensureReligionState(ch);
  if (ch.age < 18 || r.pilgrimage.completed || !isReligiousIdentity(r.privateIdentity)) return false;
  r.pilgrimage.planned = true; return true;
}

export function setReligiousCareer(ch, interested, path) {
  const r = ensureReligionState(ch); r.career.interested = !!interested;
  if (path) r.career.path = path;
  return true;
}

export function recordConduct(ch, category, description, source = 'life event') {
  const r = ensureReligionState(ch);
  const id = `conduct-${ch.age}-${r.conduct.length + 1}`;
  r.conduct.push({ id, age: ch.age, category, description, source, status: 'unresolved', reconciliation: null });
  return id;
}

export function reconcileConduct(ch, id, method) {
  const entry = ensureReligionState(ch).conduct.find(x => x.id === id);
  if (!entry || entry.status !== 'unresolved') return false;
  entry.status = 'addressed'; entry.reconciliation = { age: ch.age, method: method || 'Private reflection and repentance' };
  return true;
}

export function interfaithStatus(ch) {
  const r = ensureReligionState(ch), partner = ch.spouse?.alive ? ch.spouse : ch.partner?.alive ? ch.partner : null;
  if (!partner) return { hasPartner: false, civil: 'Not applicable', religious: 'Not applicable' };
  const same = partner.religion === r.publicIdentity;
  return {
    hasPartner: true,
    partnerReligion: partner.religion || 'None',
    civil: ch.spouse ? 'Civilly married' : 'Civil relationship or partnership',
    religious: same ? 'Same public religion' : 'Interfaith — religious recognition requires tradition-specific review',
  };
}

function donationAmount(plan, earnedIncome) {
  return plan.mode === 'percent' ? Math.max(0, earnedIncome) * (plan.percent || 0) / 100 : Math.max(0, plan.amount || 0);
}

export function resolveReligionYear(ch, country, rng, { earnedIncome = 0 } = {}) {
  const r = ensureReligionState(ch), logs = [], expenses = [];
  const enabled = RELIGIOUS_COMMITMENTS.filter(x => r.commitments[x.id]);
  const autonomyAge = r.upbringing.autonomyAge || 16;
  const guardianLed = ch.age >= 6 && ch.age < autonomyAge && isReligiousIdentity(r.upbringing.guardianReligion);
  const eligible = ch.age >= autonomyAge && isReligiousIdentity(r.privateIdentity);
  let completed = 0, blocked = [];
  if (eligible) {
    for (const item of enabled) {
      const healthBlocked = ch.stats.health < 15 && rng.chance(.35);
      if (healthBlocked) blocked.push(item.id); else completed += 1;
    }
    const target = enabled.length ? 30 + completed / enabled.length * 65 : 20;
    r.observanceScore = Math.max(0, Math.min(100, r.observanceScore * .72 + target * .28));
    const beliefFactor = r.privateBelief === 'questioning' ? .65 : r.privateBelief === 'different' ? .85 : 1;
    r.pietyScore = Math.max(0, Math.min(100, r.pietyScore * .78 + target * beliefFactor * .22));
    if (r.commitments.community && r.community.member && !blocked.includes('community')) r.community.standing = Math.min(100, r.community.standing + 1);
  } else if (ch.age >= autonomyAge) { r.observanceScore = Math.max(0, r.observanceScore - 2); r.pietyScore = Math.max(0, r.pietyScore - 2); }

  const plan = r.charity;
  let donated = 0, donationStatus = plan.enabled ? 'not due' : 'disabled';
  if (plan.enabled && ch.age >= 16) {
    const requested = donationAmount(plan, earnedIncome);
    const sourceAvailable = plan.source === 'household' ? (ch.money.household || 0) + earnedIncome : (ch.money.cash || 0) + (ch.money.bank || 0) + earnedIncome;
    if (requested <= 0) donationStatus = 'no amount set';
    else if (requested > sourceAvailable) {
      donationStatus = 'unaffordable';
      logs.push(`Your standing charity commitment to ${plan.purpose.toLowerCase()} could not be funded this year.`);
    } else {
      donated = requested; donationStatus = 'completed';
      expenses.push({ label: `Charity — ${plan.purpose}`, amount: donated, household: plan.source === 'household' });
      plan.lifetimeGiven += donated;
      r.community.standing = Math.min(100, r.community.standing + Math.min(3, 1 + donated / Math.max(1, medianWage(country))));
    }
    plan.history.push({ age: ch.age, requested, amount: donated, purpose: plan.purpose, status: donationStatus });
    if (plan.history.length > 120) plan.history.shift();
  }

  let pilgrimage = 'not planned';
  if (r.pilgrimage.planned && !r.pilgrimage.completed) {
    const cost = medianWage(country) * .45, available = (ch.money.cash || 0) + (ch.money.bank || 0) + earnedIncome;
    if (ch.age < 18 || ch.stats.health < 30) { pilgrimage = 'deferred for eligibility, health, or access'; logs.push('Your planned lifetime pilgrimage was deferred.'); }
    else if (cost > available) { pilgrimage = 'deferred as unaffordable'; logs.push('Your planned lifetime pilgrimage was deferred because it was unaffordable.'); }
    else {
      pilgrimage = 'completed'; r.pilgrimage.completed = true; r.pilgrimage.completedAge = ch.age; r.pilgrimage.planned = false;
      expenses.push({ label: 'Lifetime religious pilgrimage', amount: cost });
      r.pilgrimage.history.push({ age: ch.age, status: 'completed', cost });
      r.observanceScore = Math.min(100, r.observanceScore + 8); r.community.standing = Math.min(100, r.community.standing + 3);
      logs.push('You completed a once-in-a-lifetime religious pilgrimage.');
    }
  }

  if (r.career.interested && ch.age >= 16 && r.commitments.study && !blocked.includes('study')) {
    r.career.preparationYears += 1;
    r.career.history.push({ age: ch.age, type: 'preparation', path: r.career.path });
  }

  const enabledRecord = guardianLed ? ['guardian-led upbringing'] : enabled.map(x => x.id);
  const completedRecord = guardianLed ? ['guardian-led upbringing'] : enabled.filter(x => !blocked.includes(x.id)).map(x => x.id);
  r.annualHistory.push({ age: ch.age, enabled: enabledRecord, completed: completedRecord, blocked, donated, donationStatus, pilgrimage });
  if (r.annualHistory.length > 120) r.annualHistory.shift();
  return { logs, expenses };
}

export function religiousLegacy(ch) {
  const r = ensureReligionState(ch), addressed = r.conduct.filter(x => x.status === 'addressed').length;
  const activeYears = r.annualHistory.filter(x => x.enabled.length).length;
  const parts = [];
  if (r.charity.lifetimeGiven > 0) parts.push('a record of charitable giving');
  if (activeYears >= 10) parts.push('a long-standing religious practice');
  if (r.career.preparationYears > 0) parts.push('religious study or vocational preparation');
  if (r.pilgrimage.completed) parts.push('a completed lifetime pilgrimage');
  if (addressed > 0) parts.push('efforts to reconcile past conduct');
  return {
    publicIdentity: r.publicIdentity, privateIdentity: r.privateIdentity, observance: observanceLabel(ch), piety: pietyLabel(ch),
    lifetimeGiven: r.charity.lifetimeGiven, activeYears, addressedConduct: addressed,
    summary: parts.length ? `They left ${parts.join(', ')}.` : 'Their religious or charitable legacy remained private or limited.',
  };
}
