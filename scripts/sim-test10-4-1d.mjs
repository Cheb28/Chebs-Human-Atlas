import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COUNTRY_BY_NAME, medianWage } from '../src/engine/countries.js';
import { deserialize, newGame, serialize, stepYear } from '../src/engine/game.js';
import { evaluateAction } from '../src/ui/actionFeedback.js';
import { purchaseVehicle, requestDrivingLicense, updateReligionCommitment, updateSexualChoice, updateSubstanceUse, updateUtilityUse, updateVehicleInsurance } from '../src/engine/actions.js';
import { openInvestigation } from '../src/engine/judicial.js';

console.log('=== Phase 10.4.1D action feedback, visual calm, and complex-save checks ===');
let touched=0;
let outcome=evaluateAction(()=>{touched++;return true;},{success:'Completed.'});assert.equal(outcome.ok,true);assert.equal(outcome.message,'Completed.');assert.equal(touched,1);
outcome=evaluateAction(()=>false);assert.equal(outcome.ok,false);assert.match(outcome.message,/not available/i);
outcome=evaluateAction(()=>({ok:false,reason:'Missing licence.'}));assert.equal(outcome.message,'Missing licence.');
outcome=evaluateAction(()=>{throw new Error('test');});assert.equal(outcome.ok,false);assert.match(outcome.message,/not advanced/i);

const uiFiles=['Career.jsx','Education.jsx','Family.jsx','Finances.jsx','Law.jsx','Mobility.jsx','Religion.jsx','Travel.jsx'];
for(const file of uiFiles){const source=readFileSync(new URL(`../src/ui/tabs/${file}`,import.meta.url),'utf8');assert(source.includes('actionFeedback'),`${file} must use shared action feedback`);}
const appSource=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');assert(appSource.includes('evaluateAction'));assert(appSource.includes('role="status"'));
const css=readFileSync(new URL('../src/ui/theme.css',import.meta.url),'utf8');for(const token of ['.status-good','.status-warn','.status-bad','.empty-state','.compact-details','button:disabled'])assert(css.includes(token));

// A complicated life must survive JSON export/import and then resume deterministically.
const us=COUNTRY_BY_NAME['United States'],state=newGame({countryId:us.id,seed:1041_4001,wealthClass:'Rich'}),ch=state.character;ch.age=32;ch.money.bank=medianWage(us)*30;
requestDrivingLicense(state,false);purchaseVehicle(state,'electric_car',true);updateVehicleInsurance(state,'comprehensive');updateUtilityUse(state,'electricity','high');
updateSubstanceUse(state,'cannabis','regular');updateSexualChoice(state,{pattern:'steady',protection:'usually',testing:'yearly'});updateReligionCommitment(state,'worship',true);
ch.spouse={id:'feedback-spouse',relation:'Spouse',alive:true,sex:'female',ageOffset:0,relationshipScore:78,countryId:us.id,citizenships:[us.id],finances:{personalSavings:1000}};
ch.family.push({id:'feedback-child',relation:'Child',alive:true,sex:'male',ageOffset:30,relationshipScore:75,countryId:us.id,citizenships:[us.id],credentials:[],grandchildren:[],healthConditions:[],personalSavings:0});
openInvestigation(ch,us,'petty',{guilty:true,evidence:.5});
const json=JSON.stringify(serialize(state));assert(json.length>1000);const restored=deserialize(JSON.parse(json));
assert.equal(restored.character.transportation.vehicle.type,'electric_car');assert.equal(restored.character.spouse.id,'feedback-spouse');assert(restored.character.family.some(x=>x.id==='feedback-child'));assert.equal(restored.character.adultLife.substances.cannabis,'regular');assert.equal(restored.character.judicial.investigation.offence,'petty');
const a=deserialize(JSON.parse(json)),b=deserialize(JSON.parse(json));stepYear(a);stepYear(b);assert.deepEqual(serialize(a),serialize(b),'the same exported save must resume with the same yearly result');

console.log('Phase 10.4.1D checks passed.');
