import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { newGame, stepYear } from '../src/engine/game.js';
import { COUNTRY_BY_ID } from '../src/engine/countries.js';
import { bmi, setHabit } from '../src/engine/lifeState.js';

console.log('=== Phase 10.4.1A life system and interface checks ===');
const state=newGame({countryId:'united-states',sex:'female',seed:10411}),ch=state.character,country=COUNTRY_BY_ID[ch.countryId];
assert(ch.lifeState?.body?.heightCm>35&&ch.lifeState.body.heightCm<70,'plausible newborn height');
ch.age=20;ch.employmentStatus='unemployed';setHabit(ch,country,'exercise','regular');setHabit(ch,country,'smoking','regular');
const habits={...ch.lifeState.habits};stepYear(state);
assert.equal(ch.lifeState.habits.exercise,habits.exercise,'habits persist after aging');
assert(ch.lifeState.body.heightCm>140&&ch.lifeState.body.heightCm<200,'plausible adult height');
assert(ch.lifeState.body.weightKg>35&&ch.lifeState.body.weightKg<180,'plausible adult weight');
assert(bmi(ch)>14&&bmi(ch)<48,'BMI is calculated');
assert(ch.lifeState.exposures.packYears>0,'smoking exposure accumulates');
assert(ch.lifeState.measurements.exerciseMinutesWeek===120,'habit maps to a real exercise measure');

const tabbar=readFileSync(new URL('../src/ui/TabBar.jsx',import.meta.url),'utf8');
for(const id of ['overview','activities','work','education','family','health','finances','places','religion','law','settings'])assert(tabbar.includes(`id: '${id}'`));
for(const id of ['country','career','business','travel','events','world'])assert(!tabbar.includes(`id: '${id}'`));
const overview=readFileSync(new URL('../src/ui/tabs/Overview.jsx',import.meta.url),'utf8');
assert(overview.includes('Unresolved Decisions')&&overview.includes('Needs Attention'));
const health=readFileSync(new URL('../src/ui/tabs/Health.jsx',import.meta.url),'utf8');
for(const label of ['Height','Weight','BMI','Smoking exposure'])assert(health.includes(label));
for(const file of ['Overview.jsx','Health.jsx']){const ui=readFileSync(new URL(`../src/ui/tabs/${file}`,import.meta.url),'utf8');assert(!ui.includes('STAT_COLORS'));assert(!ui.includes('stats.health'));}
console.log('Phase 10.4.1A checks passed.');
