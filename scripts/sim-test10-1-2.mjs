import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { newGame, deserialize, serialize, stepYear } from '../src/engine/game.js';
import { COUNTRY_BY_NAME } from '../src/engine/countries.js';
import { ACTIVITIES, applyActivities } from '../src/engine/activities.js';
import { recordWorkYear } from '../src/engine/experience.js';
import { autosave, getSaveSettings, listSaves, setAutosaveInterval } from '../src/engine/saves.js';

console.log('=== Phase 10.1.2 identity, experience, languages, and settings checks ===');
const us=COUNTRY_BY_NAME['United States'],turkey=COUNTRY_BY_NAME.Turkey,germany=COUNTRY_BY_NAME.Germany;

const fresh=newGame({countryId:us.id,seed:101201}).character;
assert(!('skills' in fresh),'new characters no longer store abstract XP skills');
assert(fresh.experience&&fresh.education.performance===50,'experience and academic performance replace XP');
recordWorkYear(fresh,'service');assert.equal(fresh.experience.sectors.service,1,'employment is measured in real years');

assert(ACTIVITIES.some(a=>a.id==='studying'&&a.label==='Studying & Reading'));
assert(!ACTIVITIES.some(a=>a.id==='reading'),'separate reading activity was removed');
fresh.age=12;fresh.education.enrolled=true;const before={intelligence:fresh.stats.intelligence,happiness:fresh.stats.happiness,performance:fresh.education.performance};
applyActivities(fresh,us,{next:()=>.5},['studying']);
assert(fresh.stats.intelligence>before.intelligence&&fresh.stats.happiness>before.happiness&&fresh.education.performance>before.performance);

const localTurkish=newGame({countryId:turkey.id,ethnicity:'Local',seed:101202}).character;
assert.deepEqual(localTurkish.nativeLanguages,['Turkish']);
assert.equal(localTurkish.languages.Turkish,10,'newborns begin with household exposure, not adult fluency');
assert.equal(localTurkish.languages.Kurdish,undefined,'country language lists do not make everyone bilingual');
const kurdish=newGame({countryId:turkey.id,ethnicity:'Kurdish',seed:101203}).character;
assert.deepEqual(kurdish.nativeLanguages,['Kurdish']);
const kurdishSchool=newGame({countryId:turkey.id,ethnicity:'Kurdish',seed:101204});for(let i=0;i<6;i++)stepYear(kurdishSchool);
assert(kurdishSchool.character.languages.Turkish>=20,'the country school language begins through schooling rather than automatic birth fluency');
const multinational=newGame({countryId:us.id,secondNationalityCountryId:germany.id,foreignParentRelation:'Mother',seed:101205}).character;
assert(multinational.nativeLanguages.includes('English')&&multinational.nativeLanguages.includes('German'),'a foreign parent can pass on a household language');

const legacy=serialize(newGame({countryId:turkey.id,ethnicity:'Local',seed:101206}));
legacy.character.skills={academic:80,vocational:40,business:20,political:20};delete legacy.character.experience;
legacy.character.identity.preferredName='Preferred';legacy.character.identity.nickname='Nick';
legacy.character.languageModelVersion=1;legacy.character.nativeLanguages=['Turkish','Kurdish'];legacy.character.languages={Turkish:100,Kurdish:100};
const migrated=deserialize(legacy).character;
assert(!('skills' in migrated)&&migrated.experience,'old XP saves migrate to the experience record');
assert.equal(migrated.identity.preferredName,undefined);assert.equal(migrated.identity.nickname,undefined);
assert.deepEqual(migrated.nativeLanguages,['Turkish'],'old automatic bilingual assignment is corrected');

const memory=new Map();globalThis.localStorage={get length(){return memory.size;},key:i=>[...memory.keys()][i]??null,getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
for(const value of [0,1,5,10]){setAutosaveInterval(value);assert.equal(getSaveSettings().autosaveInterval,value);}
const saveGame=newGame({countryId:us.id,seed:101207});saveGame.character.age=4;setAutosaveInterval(5);assert.equal(autosave(saveGame),false);saveGame.character.age=5;assert.equal(autosave(saveGame),true);assert.equal(listSaves().filter(x=>x.auto).length,1);setAutosaveInterval(0);saveGame.character.age=10;assert.equal(autosave(saveGame),false);

const overview=await readFile(new URL('../src/ui/tabs/Overview.jsx',import.meta.url),'utf8');
const law=await readFile(new URL('../src/ui/tabs/Law.jsx',import.meta.url),'utf8');
const tabs=await readFile(new URL('../src/ui/TabBar.jsx',import.meta.url),'utf8');
assert(!/Preferred display name|Nickname/.test(overview));assert.match(law,/Civil and Legal Identity/);assert.match(tabs,/settings.*Settings/);

console.log('Phase 10.1.2 checks passed.');
