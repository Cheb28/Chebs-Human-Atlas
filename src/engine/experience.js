const SECTORS=['informal','service','industrial','professional'];

export function initExperience(){
  return{sectors:Object.fromEntries(SECTORS.map(k=>[k,0])),managementYears:0,businessYears:0,
    profitableBusinessYears:0,civicYears:0,training:{vocational:0,business:0},accomplishments:[]};
}

function clamp(v,lo=0,hi=100){return Math.max(lo,Math.min(hi,v));}

// Older saves stored four XP totals. Convert them once into conservative, age-plausible
// preparation and experience, then remove the obsolete XP record.
export function ensureExperience(ch){
  if(!ch.experience){
    const legacy=ch.skills||{},ageCap=Math.max(0,(ch.age||0)-14),next=initExperience();
    next.sectors.industrial=Math.min(ageCap,Math.floor((legacy.vocational||0)/20));
    next.businessYears=Math.min(ageCap,Math.floor((legacy.business||0)/20));
    next.civicYears=Math.min(ageCap,Math.floor((legacy.political||0)/20));
    if(ch.education)ch.education.performance=clamp(ch.education.performance??45+Math.min(40,(legacy.academic||0)*.4));
    next.accomplishments.push(...(ch.education?.credentials||[]));
    ch.experience=next;
  }
  ch.experience.sectors={...Object.fromEntries(SECTORS.map(k=>[k,0])),...(ch.experience.sectors||{})};
  ch.experience.training={vocational:0,business:0,...(ch.experience.training||{})};
  ch.experience.accomplishments||=[];
  delete ch.skills;
  return ch.experience;
}

export function sectorYears(ch,sector){return ensureExperience(ch).sectors[sector]||0;}
export function vocationalYears(ch){const x=ensureExperience(ch);return (x.training.vocational||0)+sectorYears(ch,'industrial');}
export function relevantExperience(ch,sector){
  if(sector==='professional')return sectorYears(ch,'professional');
  if(sector==='industrial')return vocationalYears(ch);
  return sectorYears(ch,sector);
}
export function recordWorkYear(ch,sector,rung=0){
  const x=ensureExperience(ch);x.sectors[sector]=(x.sectors[sector]||0)+1;
  if((sector==='professional'&&rung>=1)||(['service','industrial','informal'].includes(sector)&&rung>=2))x.managementYears+=1;
}
export function addTrainingYear(ch,kind){const x=ensureExperience(ch);x.training[kind]=(x.training[kind]||0)+1;}
export function addCivicYear(ch){ensureExperience(ch).civicYears+=1;}
export function addBusinessYear(ch,profitable=false){const x=ensureExperience(ch);x.businessYears+=1;if(profitable)x.profitableBusinessYears+=1;}
export function addAccomplishment(ch,label){const x=ensureExperience(ch);if(label&&!x.accomplishments.includes(label))x.accomplishments.push(label);}

export function experienceSummary(ch){
  const x=ensureExperience(ch),items=[];
  for(const [key,value] of Object.entries(x.sectors))if(value>0)items.push(`${key[0].toUpperCase()+key.slice(1)}: ${value} year${value===1?'':'s'}`);
  if(x.managementYears)items.push(`Management: ${x.managementYears} year${x.managementYears===1?'':'s'}`);
  if(x.businessYears)items.push(`Business ownership: ${x.businessYears} year${x.businessYears===1?'':'s'}`);
  if(x.civicYears)items.push(`Civic involvement: ${x.civicYears} year${x.civicYears===1?'':'s'}`);
  if(x.training.vocational)items.push(`Vocational training: ${x.training.vocational} year${x.training.vocational===1?'':'s'}`);
  if(x.training.business)items.push(`Business study: ${x.training.business} year${x.training.business===1?'':'s'}`);
  return items;
}
