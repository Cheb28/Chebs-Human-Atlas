import { useState } from 'react';
import { COUNTRY_BY_ID, medianWage } from '../../engine/countries.js';
import { availableActivities, slotBudget } from '../../engine/activities.js';
import { LIFESTYLES } from '../../engine/economy.js';
import { setActivities, setLifestyle, setPartTimeWork, updateDiet, updateHabit, updateSleepTarget } from '../../engine/actions.js';
import { HABITS, INTENSITIES, INTENSITY_LABELS, ensureLifeState, weeklyTime } from '../../engine/lifeState.js';
import { laborProfile, teenPartTimeIncome } from '../../engine/labor.js';
import { money } from '../format.js';
import { visaWorkFraction } from '../../engine/immigration.js';
import { languageLevel, primaryLanguages, languageProficiencyLabel } from '../../engine/language.js';

const TABS=[['routine','Yearly Routine'],['habits','Habits & Leisure'],['time','Time & Lifestyle']];
const measure=(id,m)=>({exercise:`${Math.round(m.exerciseMinutesWeek||0)} min/week`,socializing:`${Math.round(m.socialHoursWeek||0)} hr/week`,partying:`${Math.round(m.partyEventsMonth||0)} events/month`,smoking:`${m.cigarettesDay||0} cigarettes/day`,alcohol:`${m.drinksWeek||0} drinks/week`,gambling:`${m.gamblingHoursWeek||0} hr/week`,gaming:`${m.gamingHoursWeek||0} hr/week`}[id]);

export default function Activities({ state, refresh }) {
  const ch=state.character,country=COUNTRY_BY_ID[ch.countryId],life=ensureLifeState(ch,country);
  const [section,setSection]=useState('routine'),budget=slotBudget(ch),avail=availableActivities(ch,country),selected=ch.selectedActivities||[];
  const labor=laborProfile(country),canTeenWork=ch.age>=labor.lightWorkAge&&ch.age<18;
  const canStudentWork=ch.age>=18&&ch.employmentStatus==='student'&&ch.immigration?.residence?.visa?.kind==='student';
  const localLanguages=primaryLanguages(country),time=weeklyTime(ch);
  const toggle=id=>{const next=selected.includes(id)?selected.filter(x=>x!==id):selected.length<budget?[...selected,id]:selected;setActivities(state,next);refresh();};
  const toggleWork=enabled=>{setPartTimeWork(state,enabled);const next=slotBudget(ch);if(ch.selectedActivities.length>next)setActivities(state,ch.selectedActivities.slice(0,next));refresh();};
  return <div>
    <div className="section-tabs" role="tablist" aria-label="Activities sections">{TABS.map(([id,label])=><button key={id} className={section===id?'active':''} onClick={()=>setSection(id)}>{label}</button>)}</div>
    {section==='routine'&&<div className="panel"><h3>Yearly routine — {selected.length} / {budget} slots</h3>
      <p className="muted">Your routine stays selected until you change it or your available time changes. Empty slots become rest.</p>
      {ch.age<6?<div className="muted">You are too young to choose your own routine.</div>:<>
        {localLanguages.length>0&&<label className="field"><span>Language to learn</span><select value={ch.languageStudyTarget||''} onChange={e=>{ch.languageStudyTarget=e.target.value||null;refresh();}}><option value="">Choose a primary local language</option>{localLanguages.filter(x=>languageLevel(ch,x)<100).map(x=><option key={x} value={x}>{x} ({languageProficiencyLabel(ch,x)})</option>)}</select></label>}
        {avail.map(a=>{const on=selected.includes(a.id),full=!on&&selected.length>=budget;return <label className="activity" key={a.id} style={{display:'flex',gap:10,padding:'8px 4px',opacity:full ? .45 : 1}}><input type="checkbox" checked={on} disabled={full} onChange={()=>toggle(a.id)}/><span style={{flex:1}}>{a.label}</span><span className="muted">{a.desc}</span></label>;})}
      </>}
      {(canTeenWork||canStudentWork)&&<label className="check-row"><input type="checkbox" checked={!!ch.partTimeWork} onChange={e=>toggleWork(e.target.checked)}/><span><strong>{canTeenWork?'Part-time work':'Work within student-visa conditions'}</strong><br/><span className="muted">{canTeenWork?`Earn about ${money(teenPartTimeIncome(country,ch))}; work uses one routine slot.`:`About ${Math.round(visaWorkFraction(ch)*40)} hours/week and roughly ${money(medianWage(country)*.7*visaWorkFraction(ch))}.`}</span></span></label>}
    </div>}
    {section==='habits'&&<div className="grid cols-2">{HABITS.map(h=><div className="panel" key={h.id} style={{opacity:ch.age<h.minAge?.55:1}}><h3>{h.label}</h3><p className="muted">{h.benefit}</p><label className="field"><span>Usual level</span><select disabled={ch.age<h.minAge} value={life.habits[h.id]} onChange={e=>{updateHabit(state,h.id,e.target.value);refresh();}}>{INTENSITIES.map(x=><option key={x} value={x}>{INTENSITY_LABELS[x]}</option>)}</select></label><div className="kv"><span>Current measure</span><span>{measure(h.id,life.measurements)}</span></div>{h.id==='smoking'&&<div className="kv"><span>Lifetime exposure</span><span>{life.exposures.packYears.toFixed(1)} pack-years</span></div>}<p className="muted">This setting remains in place each year until you change it.</p></div>)}</div>}
    {section==='time'&&<div className="grid cols-2"><div className="panel"><h3>Weekly time</h3>{Object.entries({Work:time.jobHours,Education:time.schoolHours,Childcare:time.childcare,Caregiving:time.care,Household:time.household,'Habits & leisure':time.habitHours,Sleep:time.sleep,'Free time':time.free}).map(([k,v])=><div className="kv" key={k}><span>{k}</span><span>about {Math.round(v)} hr</span></div>)}<p className="muted">This is an annual average, not a seasonal schedule.</p></div><div className="panel"><h3>Body routines</h3><label className="field"><span>Usual diet pattern</span><select value={life.diet} onChange={e=>{updateDiet(state,e.target.value);refresh();}}><option value="balanced">Balanced</option><option value="convenience">Convenience-heavy</option><option value="comfort">Rich / comfort-focused</option><option value="restricted">Restricted intake</option></select></label><label className="field"><span>Sleep target</span><input type="number" min="4" max="12" step="0.5" value={life.sleepTargetHours} onChange={e=>{updateSleepTarget(state,e.target.value);refresh();}}/> hours/night</label><h3 style={{marginTop:18}}>Living standard</h3>{Object.entries(LIFESTYLES).map(([key,ls])=><label className="check-row" key={key}><input type="radio" name="lifestyle" checked={(ch.lifestyle||'normal')===key} onChange={()=>{setLifestyle(state,key);refresh();}}/><span><strong>{ls.label}</strong><br/><span className="muted">Cost of living ×{ls.colMult}; affects comfort and enjoyment.</span></span></label>)}</div></div>}
  </div>;
}
