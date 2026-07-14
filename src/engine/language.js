// Compact language-proficiency model. Country source strings can include
// percentages and notes; gameplay intentionally exposes at most two primary
// languages per country instead of hundreds of regional/minority languages.

const NATURALIZATION_LANGUAGE = {
  Australia:60, Austria:70, Canada:60, Denmark:60, Finland:55, France:60,
  Germany:60, Italy:50, Japan:60, Netherlands:60, 'New Zealand':60,
  Norway:55, Portugal:50, 'South Korea':60, Spain:50, Sweden:50,
  Switzerland:60, 'United Kingdom':60, 'United States':50,
};

export function canonicalLanguage(value) {
  return String(value || '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\b\d+(?:\.\d+)?%.*$/g, '')
    .split(/\s+or\s+|\//i)[0]
    .replace(/\bofficial\b/gi, '')
    .replace(/\bonly\b/gi, '')
    .replace(/[()]/g,'')
    .replace(/\s+/g, ' ').trim();
}

export function primaryLanguages(country) {
  return [...new Set((country?.languages || []).map(canonicalLanguage).filter(lang=>lang&&!/^(lingua franca|widely spoken|other)$/i.test(lang)))].slice(0,2);
}

function ethnicityLanguage(ethnicity,languages){
  const value=canonicalLanguage(ethnicity).toLowerCase();
  return languages.slice(1).find(lang=>value.includes(canonicalLanguage(lang).toLowerCase())||canonicalLanguage(lang).toLowerCase().includes(value));
}

export function assignBirthLanguages(ch,birthCountry,countryLookup={}){
  const available=primaryLanguages(birthCountry),minority=ethnicityLanguage(ch.ethnicity,available);
  const household=[minority||available[0]].filter(Boolean);
  for(const parent of ch.family||[]){
    if(!['Father','Mother'].includes(parent.relation)||parent.countryId===birthCountry.id)continue;
    const foreign=countryLookup[parent.countryId];
    const inherited=primaryLanguages(foreign)[0];
    if(inherited&&!household.includes(inherited)&&household.length<2)household.push(inherited);
  }
  ch.nativeLanguages=household;
  ch.languages=Object.fromEntries(household.map(lang=>[lang,10]));
  ch.languageModelVersion=2;
  return ch.languages;
}

export function migrateLanguages(ch,birthCountry,countryLookup={}){
  if(ch.languageModelVersion>=2)return ensureLanguages(ch,birthCountry);
  assignBirthLanguages(ch,birthCountry,countryLookup);
  const maturity=Math.min(100,10+Math.max(0,ch.age||0)*20);
  for(const lang of ch.nativeLanguages)ch.languages[lang]=maturity;
  const schoolLanguage=primaryLanguages(birthCountry)[0];
  if((ch.age||0)>=6&&schoolLanguage)ch.languages[schoolLanguage]=Math.max(ch.languages[schoolLanguage]||0,Math.min(100,20+((ch.age||0)-6)*20));
  return ch.languages;
}

export function resolveLanguageDevelopment(ch,country){
  ensureLanguages(ch,country);
  const maturity=Math.min(100,10+Math.max(0,ch.age||0)*20);
  for(const lang of ch.nativeLanguages||[])ch.languages[canonicalLanguage(lang)]=Math.max(ch.languages[canonicalLanguage(lang)]||0,maturity);
  const schoolLanguage=primaryLanguages(country)[0];
  if((ch.age||0)>=6&&schoolLanguage)ch.languages[schoolLanguage]=Math.max(ch.languages[schoolLanguage]||0,Math.min(100,20+((ch.age||0)-6)*20));
}

export function ensureLanguages(ch, birthCountry) {
  ch.languages ||= {};
  for (const lang of ch.nativeLanguages || [primaryLanguages(birthCountry)[0]]) ch.languages[canonicalLanguage(lang)] ??= 100;
  return ch.languages;
}

export function languageLevel(ch, language) {
  const wanted=canonicalLanguage(language).toLowerCase();
  const entry=Object.entries(ch.languages||{}).find(([name])=>canonicalLanguage(name).toLowerCase()===wanted);
  return entry ? entry[1] : 0;
}

export function languageProficiencyLabel(ch,language){
  const level=languageLevel(ch,language),native=(ch.nativeLanguages||[]).some(x=>canonicalLanguage(x).toLowerCase()===canonicalLanguage(language).toLowerCase());
  if(native&&level<40)return'Household exposure';
  if(level>=100)return native?'Native':'Fluent';
  if(level>=75)return'Advanced';if(level>=55)return'Working proficiency';if(level>=30)return'Conversational';if(level>0)return'Beginner';return'Not learned';
}

export function improveStudiedLanguage(ch) {
  const lang=canonicalLanguage(ch.languageStudyTarget);
  if(!lang)return null;
  ch.languages ||= {};
  ch.languages[lang]=Math.min(100,(ch.languages[lang]||0)+20);
  if(ch.languages[lang]>=100)ch.languageStudyTarget=null;
  return lang;
}

export function destinationLanguageLevel(ch,country) {
  const langs=primaryLanguages(country);
  if(!langs.length)return 100;
  return Math.max(...langs.map(lang=>languageLevel(ch,lang)));
}

export function workLanguageMultiplier(ch,country) {
  const level=destinationLanguageLevel(ch,country);
  if(level>=60)return 1;
  if(level>=40)return .95;
  if(level>=20)return .85;
  return .75;
}

export function naturalizationLanguageRequirement(country) {
  const required=NATURALIZATION_LANGUAGE[country?.name]||0;
  return {required,language:primaryLanguages(country)[0]||'local language'};
}
