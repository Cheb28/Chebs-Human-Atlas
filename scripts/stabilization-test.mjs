import assert from 'node:assert/strict';
import { COUNTRIES, COUNTRY_BY_NAME, medianWage } from '../src/engine/countries.js';
import { newGame, serialize, stepYear } from '../src/engine/game.js';
import { availableActivities, slotBudget } from '../src/engine/activities.js';
import { applyCreditCard, buyInvestment, foundBusiness, purchaseVehicle, requestDrivingLicense, requestPassport, setActivities, setDatingIntent, setFriendIntent, setJobSearch, setPlannedCrime, updateDiet, updateDrivingSafety, updateHabit, updateReligionCommitment, updateSexualChoice, updateSleepTarget, updateSubstanceUse, updateUtilityUse, updateVehicleInsurance } from '../src/engine/actions.js';
import { departureBlock, immigrationOptions, moveCharacter, resolveImmigration, submitMigration } from '../src/engine/immigration.js';
import { fleePendingCase, openCivilCase, openCriminalCase, openInvestigation, resolveJudicialYear } from '../src/engine/judicial.js';

console.log('=== Pre-10.4.1D stabilization, departure, and cross-system stress checks ===');
const us=COUNTRY_BY_NAME['United States'],germany=COUNTRY_BY_NAME.Germany,sweden=COUNTRY_BY_NAME.Sweden,somalia=COUNTRY_BY_NAME.Somalia;
const prepareTraveler=(country=us,seed=120001)=>{const state=newGame({countryId:country.id,seed,wealthClass:'Rich'}),ch=state.character;ch.age=30;ch.money.bank=medianWage(country)*30;ch.education.degree="Bachelor's degree";ch.education.stage='graduated';ch.experience.sectors.professional=4;ch.transportation.documents.passports.push({countryId:country.id,issuedAge:20,expiresAge:40});return state;};

// Civil cases do not become criminal travel bans.
const civil=prepareTraveler(us,120002);openCivilCase(civil.character,'business_dispute',1000);
assert.equal(departureBlock(civil.character,germany,'skilled'),null);

// A low-level investigation without an exit order permits legal departure; serious investigations do not.
const lowInvestigation=prepareTraveler(us,120003);openInvestigation(lowInvestigation.character,us,'petty',{guilty:true});
assert.equal(lowInvestigation.character.judicial.investigation.exitRestricted,false);
assert.equal(immigrationOptions(lowInvestigation.character,lowInvestigation,germany).find(x=>x.id==='skilled').eligible,true);
const seriousInvestigation=prepareTraveler(us,120004);openInvestigation(seriousInvestigation.character,us,'fraud',{guilty:true});
assert.equal(seriousInvestigation.character.judicial.investigation.exitRestricted,true);
assert.equal(immigrationOptions(seriousInvestigation.character,seriousInvestigation,germany).find(x=>x.id==='skilled').eligible,false);
assert.equal(immigrationOptions(seriousInvestigation.character,seriousInvestigation,germany).find(x=>x.id==='irregular').eligible,true);

// A criminal charge blocks legal migration, but an attempted irregular escape creates a fugitive warrant.
const charged=prepareTraveler(us,120005);openCriminalCase(charged.character,us,'fraud',{guilty:true});
let chargedRoutes=immigrationOptions(charged.character,charged,germany);
assert.equal(chargedRoutes.find(x=>x.id==='skilled').eligible,false);
assert.equal(chargedRoutes.find(x=>x.id==='irregular').eligible,true);
assert.equal(submitMigration(charged,germany.id,'irregular').ok,true);
assert.equal(charged.character.judicial.status,'fugitive');assert(charged.character.judicial.warrant?.extraditable);

// A previously filed legal application is rechecked and cancelled if a serious charge appears before departure.
const pending=prepareTraveler(us,120006);assert.equal(submitMigration(pending,germany.id,'skilled').ok,true);
openCriminalCase(pending.character,us,'fraud',{guilty:true});
const cancelled=resolveImmigration(pending.character,pending,{chance:()=>false});
assert.equal(pending.character.immigration.pending,null);assert(cancelled.logs.some(x=>/cancelled/.test(x)));

// Extraditable warrants can return a fugitive; culturally specific/non-serious offences do not use that machinery.
const fugitive=prepareTraveler(us,120007);openCriminalCase(fugitive.character,us,'fraud',{guilty:true});fleePendingCase(fugitive.character);moveCharacter(fugitive.character,germany,'irregular',30,{irregular:true});fugitive.character.immigration.residence.status='legal';
const returned=resolveImmigration(fugitive.character,fugitive,{chance:()=>true});
assert.equal(fugitive.character.countryId,us.id);assert(fugitive.character.judicial.activeCase);assert.equal(fugitive.character.judicial.extraditions.length,1);assert(returned.logs.some(x=>/extradition or surrender/.test(x)));
const localOnly=prepareTraveler(us,120008);openCriminalCase(localOnly.character,us,'sex_work',{guilty:true});fleePendingCase(localOnly.character);moveCharacter(localOnly.character,germany,'irregular',30,{irregular:true});localOnly.character.immigration.residence.status='legal';resolveImmigration(localOnly.character,localOnly,{chance:()=>true});
assert.equal(localOnly.character.countryId,germany.id);assert.equal(localOnly.character.judicial.warrant.extraditable,false);
moveCharacter(localOnly.character,us,'deportation',31,{});resolveImmigration(localOnly.character,localOnly,{chance:()=>false});assert(localOnly.character.judicial.activeCase,'a fugitive arrested on return must resume the origin-country case');

// Leaving during a permitted investigation does not erase it; sufficient evidence can produce an origin-country warrant.
const leftDuringInvestigation=prepareTraveler(us,120009);openInvestigation(leftDuringInvestigation.character,us,'petty',{guilty:true,evidence:1});moveCharacter(leftDuringInvestigation.character,germany,'skilled',30,{});
resolveJudicialYear(leftDuringInvestigation.character,germany,{chance:()=>true});assert(leftDuringInvestigation.character.judicial.warrant);assert.equal(leftDuringInvestigation.character.judicial.warrant.originCountryId,us.id);

function inspect(value,path='state',seen=new Set()){if(value==null)return;if(typeof value==='number')assert(Number.isFinite(value),`${path} must be finite`);if(typeof value!=='object')return;if(seen.has(value))return;seen.add(value);for(const [key,item] of Object.entries(value))inspect(item,`${path}.${key}`,seen);}
const countries=['United States','Germany','Nigeria','India','Japan','Brazil','Pakistan','South Africa','Sweden','Saudi Arabia','Australia','Poland'];
let turns=0,deaths=0,criminalMatters=0,migrations=0,vehicles=0,businessYears=0,adultHealthYears=0;
for(let index=0;index<72;index++){
  const country=COUNTRY_BY_NAME[countries[index%countries.length]],state=newGame({countryId:country.id,seed:121000+index,wealthClass:index%4===0?'Rich':index%4===1?'Poor':'Middle'}),facet=index%6;
  while(state.character.alive&&state.character.age<130){const ch=state.character,age=ch.age,before=age,current=COUNTRIES.find(x=>x.id===ch.countryId);
    if(age>=6){const choices=availableActivities(ch,current).map(x=>x.id);setActivities(state,choices.slice(0,slotBudget(ch)));}
    if(age>=16&&!ch.job&&!ch.education?.enrolled&&!['prison','serving','career'].includes(ch.employmentStatus))setJobSearch(state,['agriculture','retail_hospitality','office_admin','construction','healthcare','transport_local'][facet]);
    if(age>=12&&age%3===0)setFriendIntent(state,true);if(age>=18&&age%4===0)setDatingIntent(state,true);
    if(age===18){updateDiet(state,facet%2?'balanced':'high_calorie');updateSleepTarget(state,facet%2?8:6);updateHabit(state,'exercise',facet%2?'regular':'none');}
    if(age>=18&&facet===1){updateSubstanceUse(state,'cannabis','regular');updateHabit(state,'alcohol','frequent');updateSexualChoice(state,{pattern:'casual',protection:'usually',testing:'yearly'});adultHealthYears++;}
    if(age>=18&&facet===2&&age%11===0){setPlannedCrime(state,age%22===0?'fraud':'petty');criminalMatters++;}
    if(age===20)requestPassport(state,ch.immigration.citizenships[0]);
    if(age===22){requestDrivingLicense(state,false);updateUtilityUse(state,'electricity',facet%2?'reduced':'high');}
    if(age===24&&facet===3){ch.money.bank+=medianWage(current)*5;if(purchaseVehicle(state,index%2?'used_car':'electric_car',true)){vehicles++;updateVehicleInsurance(state,'comprehensive');updateDrivingSafety(state,'never');}}
    if(age===26&&facet===4){ch.money.bank+=medianWage(current)*6;if(foundBusiness(state,'registered'))businessYears++;applyCreditCard(state);buyInvestment(state,'bonds',Math.min(ch.money.bank*.1,medianWage(current)));}
    if(age===28&&facet===5){updateReligionCommitment(state,'worship',true);updateReligionCommitment(state,'charity',true);}
    stepYear(state);turns++;assert.equal(state.character.age,before+1,'every turn advances exactly one year');inspect(serialize(state));
    for(const amount of Object.values(state.character.money||{}))assert(amount>=-0.01,'cash accounts cannot be negative');
    for(const amount of Object.values(state.character.debts||{}))assert((amount||0)>=-0.01,'debts cannot become negative');
    if(state.character.age<18){assert(Object.values(state.character.adultLife.substances).every(x=>x==='none'));assert.equal(state.character.adultLife.sexual.pattern,'none');}
    if(state.character.immigration.history.length>1)migrations++;
  }
  if(!state.character.alive)deaths++;
}
assert.equal(deaths,72,'all stress-test lives should reach a modeled death');assert(turns>4000);assert(vehicles>0&&businessYears>0&&adultHealthYears>0&&criminalMatters>0);
let countryTurns=0;for(let index=0;index<COUNTRIES.length;index++){const state=newGame({countryId:COUNTRIES[index].id,seed:122000+index});while(!state.over&&state.character.age<130){const age=state.character.age;stepYear(state);countryTurns++;assert.equal(state.character.age,age+1);inspect(serialize(state));}assert(state.over,`${COUNTRIES[index].name} smoke life must reach a modeled death`);}
console.log(`Stress coverage: ${turns+countryTurns} yearly turns, ${deaths+COUNTRIES.length} full lives across all ${COUNTRIES.length} countries, ${criminalMatters} planned criminal matters, ${vehicles} vehicles, ${businessYears} businesses, ${adultHealthYears} adult-health years.`);
console.log('Pre-10.4.1D stabilization checks passed.');
