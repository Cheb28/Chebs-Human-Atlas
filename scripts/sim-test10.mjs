import assert from 'node:assert/strict';
import { newGame } from '../src/engine/game.js';
import { COUNTRY_BY_NAME } from '../src/engine/countries.js';
import { resolveFamily, compatibilityScore } from '../src/engine/family.js';
import { relationshipLawProfile, canMarry } from '../src/engine/relationshipLaws.js';
import { addAccomplishment, recordWorkYear } from '../src/engine/experience.js';
import { settleEstate } from '../src/engine/inheritance.js';

const us=COUNTRY_BY_NAME['United States'],afghanistan=COUNTRY_BY_NAME.Afghanistan,japan=COUNTRY_BY_NAME.Japan;
console.log('=== Phase 10 family and social-life checks ===');

assert.equal(relationshipLawProfile(us).marriageAllowed,true);
assert.equal(relationshipLawProfile(afghanistan).status,'criminalized');
const lawState=newGame({countryId:us.id,sex:'female',seed:10001}).character;
const femalePartner={sex:'female',ageOffset:0,religion:lawState.religion,ethnicity:lawState.ethnicity,personality:lawState.personality};
assert.equal(canMarry(lawState,femalePartner,us),true);
assert.equal(canMarry(lawState,femalePartner,japan),false);
assert(compatibilityScore(lawState,femalePartner)>=70);

// Experience is recorded in real years; schooling is represented by performance and credentials.
recordWorkYear(lawState,'service');addAccomplishment(lawState,'Community organizer');
assert.equal(lawState.experience.sectors.service,1);
assert(lawState.experience.accomplishments.includes('Community organizer'));
assert(Array.isArray(lawState.education.credentials));

// Friendship and a persistent pregnancy resolve through yearly family turns.
{
  const s=newGame({countryId:us.id,sex:'female',seed:10002}),ch=s.character;
  ch.age=26;ch.stats.charisma=100;ch.social.friendIntent=true;
  for(let i=0;i<20&&!ch.social.friends.length;i++)resolveFamily(ch,us,s.rng);
  assert(ch.social.friends.length>0,'friendship intent should be able to form a friend');
  ch.spouse={id:'spouse',relation:'Spouse',alive:true,sex:'male',ageOffset:0,relationshipScore:90,compatibility:90,yearsTogether:2,working:false,conflictLevel:0,citizenships:[us.id]};
  ch.relationshipStatus='married';ch.childrenIntent='try';ch.fertility.contraception='none';
  for(let i=0;i<40&&!ch.fertility.pregnancy;i++)resolveFamily(ch,us,s.rng);
  assert(ch.fertility.pregnancy,'trying for a child should be able to create a pregnancy');
  ch.age+=1;resolveFamily(ch,us,s.rng);
  assert.equal(ch.fertility.pregnancy,null,'pregnancy should resolve the following year');
}

// Children develop education, work, relationships, and descendants.
{
  const s=newGame({countryId:us.id,seed:10003}),ch=s.character;ch.age=40;
  const child={id:'developing-child',relation:'Child',childNumber:1,alive:true,sex:'female',ageOffset:34,relationshipScore:80,personality:['curious','social'],educationOutcome:'not school age',career:null,partnerStatus:'single',ownChildren:0,healthConditions:[],stats:{health:70,happiness:60,intelligence:60,fitness:50,charisma:50},educationPerformance:50,credentials:[],atHome:true,working:false,personalSavings:0,countryId:us.id};
  ch.family.push(child);resolveFamily(ch,us,s.rng);assert.equal(child.educationOutcome,'primary school');
  ch.age=52;resolveFamily(ch,us,s.rng);assert.notEqual(child.educationOutcome,'not school age');
  ch.age=60;for(let i=0;i<30&&!child.career;i++)resolveFamily(ch,us,s.rng);
  assert(child.career,'adult children should develop careers');
}

// Estrangement and unequal wills meaningfully raise inheritance-dispute risk.
{
  const s=newGame({countryId:us.id,seed:10004}),ch=s.character;ch.money.bank=100000;
  ch.family.push({id:'favored',relation:'Child',childNumber:1,alive:true,relationshipScore:90},{id:'estranged',relation:'Child',childNumber:2,alive:true,relationshipScore:5,estranged:true});
  ch.will={written:true,shares:{favored:100,estranged:0}};
  const estate=settleEstate(ch,us);assert(estate.disputeRisk>=.5);assert.equal(estate.likelyDispute,true);
}

console.log('Phase 10 checks passed.');
