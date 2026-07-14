import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COUNTRY_BY_NAME } from '../src/engine/countries.js';
import { continueAsSuccessor, newGame, stepYear } from '../src/engine/game.js';
import { settleEstate } from '../src/engine/inheritance.js';
import {
  changePublicReligion, ensureReligionState, interfaithStatus, planLifetimePilgrimage,
  reconcileConduct, recordConduct, religiousLegacy, resolveReligionYear,
  setPrivateBelief, setReligionCommitment, updateCharityPlan,
} from '../src/engine/religion.js';

console.log('=== Phase 10.4.1 religion foundation checks ===');
const pakistan=COUNTRY_BY_NAME.Pakistan, us=COUNTRY_BY_NAME['United States'];

// Public and private identity can diverge without exposing the private choice.
{
  const ch=newGame({countryId:pakistan.id,religion:'Muslim',seed:104101}).character;ch.age=20;
  const r=ensureReligionState(ch);assert.equal(r.publicIdentity,'Muslim');assert.equal(r.tradition,'Islam');
  assert(setPrivateBelief(ch,'unaffiliated'));assert.equal(r.privateIdentity,'None');assert.equal(ch.religion,'Muslim');
  assert(changePublicReligion(ch,'None'));assert.equal(ch.religion,'None');assert.equal(r.publicIdentity,'None');
}

// Commitments persist, are recorded every year, and do not need yearly rechecking.
{
  const state=newGame({countryId:pakistan.id,religion:'Muslim',seed:104102}),ch=state.character;ch.age=20;ch.stats.health=100;
  setReligionCommitment(ch,'worship',true);setReligionCommitment(ch,'fasting',true);
  const rng=state.rng;resolveReligionYear(ch,pakistan,rng,{earnedIncome:10000});resolveReligionYear(ch,pakistan,rng,{earnedIncome:10000});
  const r=ch.religionState;assert.equal(r.commitments.worship,true);assert.equal(r.commitments.fasting,true);assert.equal(r.annualHistory.length,2);assert(r.annualHistory.every(x=>x.enabled.includes('worship')));
}

// Childhood practice is recorded as guardian-led without assigning adult observance choices to a child.
{
  const state=newGame({countryId:pakistan.id,religion:'Muslim',seed:104108}),ch=state.character;ch.age=9;
  resolveReligionYear(ch,pakistan,state.rng);const year=ch.religionState.annualHistory[0];
  assert.deepEqual(year.enabled,['guardian-led upbringing']);assert.equal(ch.religionState.upbringing.guardianLed,true);
}

// Standing charity reaches the annual statement and remains active afterward.
{
  const state=newGame({countryId:us.id,religion:'Protestant',seed:104103}),ch=state.character;ch.age=24;ch.money.bank=500000;ch.employmentStatus='unemployed';ch.stats.health=100;
  updateCharityPlan(ch,{enabled:true,mode:'fixed',amount:500,purpose:'Healthcare'});stepYear(state);
  assert(ch.lastStatement.expenses.some(x=>x.label==='Charity — Healthcare'&&x.amount===500));assert.equal(ch.religionState.charity.enabled,true);assert.equal(ch.religionState.charity.lifetimeGiven,500);
}

// A lifetime pilgrimage completes once and never charges a second time.
{
  const state=newGame({countryId:pakistan.id,religion:'Muslim',seed:104104}),ch=state.character;ch.age=30;ch.money.bank=1000000;ch.stats.health=100;
  assert(planLifetimePilgrimage(ch));const first=resolveReligionYear(ch,pakistan,state.rng,{earnedIncome:10000});
  assert.equal(ch.religionState.pilgrimage.completed,true);assert(first.expenses.some(x=>x.label==='Lifetime religious pilgrimage'));
  const second=resolveReligionYear(ch,pakistan,state.rng,{earnedIncome:10000});assert(!second.expenses.some(x=>x.label==='Lifetime religious pilgrimage'));assert(!planLifetimePilgrimage(ch));
}

// Conduct can be recorded and addressed without erasing its lifetime history.
{
  const ch=newGame({countryId:us.id,religion:'Roman Catholic',seed:104105}).character;ch.age=30;
  const id=recordConduct(ch,'harm','Caused serious harm through a deliberate choice.');assert(reconcileConduct(ch,id,'Apology or restitution'));
  assert.equal(ch.religionState.conduct[0].status,'addressed');assert.equal(religiousLegacy(ch).addressedConduct,1);
}

// Civil and religious relationship status remain separate for interfaith couples.
{
  const ch=newGame({countryId:us.id,religion:'Roman Catholic',seed:104106}).character;ch.age=30;
  ch.spouse={id:'spouse',alive:true,religion:'Muslim'};const status=interfaithStatus(ch);
  assert.equal(status.civil,'Civilly married');assert.match(status.religious,/Interfaith/);
}

// A successor keeps their own established religious life rather than inheriting the deceased's settings.
{
  const state=newGame({countryId:us.id,religion:'Protestant',seed:104107}),ch=state.character;ch.age=70;ch.money.bank=100000;
  const child=ch.family.find(x=>x.religionState);child.id='religious-heir';child.relation='Child';child.ageOffset=35;child.alive=true;child.religion='None';child.religionState.publicIdentity='None';child.religionState.privateIdentity='None';child.religionState.privateBelief='unaffiliated';
  ch.family=[child];state.over=true;state.estate=settleEstate(ch,us);const next=continueAsSuccessor(state,child.id);
  assert(next);assert.equal(next.character.religionState.publicIdentity,'None');assert.equal(next.character.religionState.privateBelief,'unaffiliated');
}

const ui=readFileSync(new URL('../src/ui/tabs/Religion.jsx',import.meta.url),'utf8');
for(const label of ['Overview','Observance','Beliefs','Charity','Conduct & Reconciliation','Community & Family','Career','Legacy'])assert(ui.includes(label));
assert(ui.includes('This remains enabled every year.'));
console.log('Phase 10.4.1 checks passed.');
