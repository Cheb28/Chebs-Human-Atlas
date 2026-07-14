import { useState } from 'react';
import { COUNTRY_BY_ID } from '../../engine/countries.js';
import { careerOptions, jobTitle, wageFor, SECTORS } from '../../engine/jobs.js';
import { experienceSummary } from '../../engine/experience.js';
import { canEnlistVoluntary, careerTitle, careerWage } from '../../engine/military.js';
import { setJobSearch, quitJob, enlistMilitary, updateReligiousCareer } from '../../engine/actions.js';
import { money, titleCase } from '../format.js';
import Business from './Business.jsx';

const TABS=[['current','Current'],['find','Find Work'],['business','Business'],['qualifications','Qualifications'],['religious','Religious Careers'],['history','History']];
const RELIGIOUS_CAREERS=['Community religious leader','Clergy or worship leader','Religious teacher or scholar','Chaplain','Monastic vocation','Religious charity worker'];

export default function Career({state,refresh,actionFeedback}){
  const ch=state.character,country=COUNTRY_BY_ID[ch.countryId],[section,setSection]=useState('current');
  const options=careerOptions(ch,country),isMinor=ch.age<16,isStudent=ch.education?.enrolled&&['university','vocational'].includes(ch.education.stage);
  const isMilitary=['career','serving'].includes(ch.military.status),isPrison=ch.employmentStatus==='prison';
  return <div>
    <div className="section-tabs" role="tablist" aria-label="Work sections">{TABS.map(([id,label])=><button key={id} className={section===id?'active':''} onClick={()=>setSection(id)}>{label}</button>)}</div>

    {section==='current'&&<div className="grid cols-2">
      <div className="panel"><h3>Current Situation</h3>
        <div className="kv"><span>Status</span><span>{titleCase(ch.employmentStatus)}</span></div>
        {ch.job?<><div className="kv"><span>Occupation</span><span>{jobTitle(ch.job)}</span></div><div className="kv"><span>Annual salary</span><span>{money(wageFor(country,ch.job,ch))}</span></div><div className="kv"><span>Time in current position</span><span>{ch.job.yearsAtRung} year(s)</span></div><div className="kv"><span>Field experience</span><span>{ch.experience?.sectors?.[ch.job.sector]||0} year(s)</span></div><button onClick={()=>actionFeedback(()=>quitJob(state),{success:'You left your job.',failure:'You do not currently have a job to leave.'})}>Quit job</button></>:<div className="muted">You do not currently hold a civilian job.</div>}
        {ch.jobSearch?.sector&&<div className="notice">Seeking work in {SECTORS[ch.jobSearch.sector]?.label||ch.jobSearch.sector}.</div>}
      </div>
      <div className="panel"><h3>Military Service</h3>
        {ch.military.status==='career'?<><div className="kv"><span>Rank</span><span>{careerTitle(ch)}</span></div><div className="kv"><span>Pay</span><span>{money(careerWage(country,ch))}/yr</span></div><div className="kv"><span>Years served</span><span>{ch.military.yearsServed}</span></div></>:ch.military.status==='serving'?<div className="kv"><span>Conscript service</span><span>{ch.military.remaining} year(s) left</span></div>:<div className="muted">{ch.veteran?'Veteran; not currently serving.':'Not serving.'}</div>}
      </div>
    </div>}

    {section==='find'&&<div className="panel"><h3>Find Work</h3>
      {isMinor&&<div className="notice warn">You are too young for regular full-time work.</div>}{isStudent&&<div className="notice warn">Full-time study must be completed or paused before seeking regular work.</div>}{isMilitary&&<div className="notice warn">Civilian applications are unavailable during military service.</div>}{isPrison&&<div className="notice warn">Civilian applications are unavailable while imprisoned.</div>}
      {!isMinor&&!isStudent&&!isMilitary&&!isPrison&&<><p className="muted">Choose a career family. Hiring resolves when you advance one year and depends on qualifications, experience, health, language, law, and the economy.</p><div className="career-list">{options.map(o=><div className="world-item" key={o.key} style={{opacity:o.eligible?1:.55}}><span className="nm">{o.label}</span><span className="rg">{o.eligible?`Entry: ${o.entryTitle}${ch.jobSearch?.sector===o.key?' ✓ applying':''}`:o.reason}</span>{o.eligible&&<button onClick={()=>actionFeedback(()=>setJobSearch(state,o.key),{success:`Application planned for ${o.label}. It will resolve when you age a year.`,failure:o.reason})}>Apply</button>}</div>)}</div>
        {canEnlistVoluntary(ch,country)&&<button style={{marginTop:14}} onClick={()=>actionFeedback(()=>enlistMilitary(state),{success:'You enlisted in the armed forces.',failure:'Voluntary enlistment is not currently available.'})}>Enlist in the armed forces</button>}</>}
    </div>}

    {section==='business'&&<Business state={state} refresh={refresh} actionFeedback={actionFeedback}/>}

    {section==='religious'&&<div className="grid cols-2"><div className="panel"><h3>Religious vocation</h3><label className="check-row"><input type="checkbox" checked={!!ch.religionState?.career?.interested} disabled={ch.age<16} onChange={e=>{updateReligiousCareer(state,e.target.checked,ch.religionState.career.path);refresh();}}/><span><strong>Pursue religious-career preparation</strong></span></label><label className="field"><span>Broad path</span><select value={ch.religionState?.career?.path||RELIGIOUS_CAREERS[0]} onChange={e=>{updateReligiousCareer(state,!!ch.religionState.career.interested,e.target.value);refresh();}}>{RELIGIOUS_CAREERS.map(x=><option key={x}>{x}</option>)}</select></label><div className="kv"><span>Preparation years</span><span>{ch.religionState?.career?.preparationYears||0}</span></div></div><div className="panel"><h3>Framework status</h3><p className="muted">Religious study builds preparation. Tradition-specific qualifications and career entry will be added in the corresponding religion expansions.</p></div></div>}

    {section==='history'&&<div className="panel"><h3>Career History</h3>{!(ch.careerHistory||[]).length?<div className="muted">No recorded career events yet.</div>:[...(ch.careerHistory||[])].reverse().map((e,i)=><div className="kv" key={`${e.age}-${i}`}><span>Age {e.age} · {titleCase(e.type)}</span><span>{e.title}{e.note?` · ${e.note}`:''}</span></div>)}</div>}

    {section==='qualifications'&&<div className="grid cols-2"><div className="panel"><h3>Credentials</h3>{(ch.education?.credentials||[]).length?(ch.education.credentials||[]).map(x=><div className="kv" key={x}><span>{x}</span><span>Completed</span></div>):<div className="muted">No formal credentials.</div>}</div><div className="panel"><h3>Experience</h3>{experienceSummary(ch).length?experienceSummary(ch).map(x=><div className="muted" key={x}>{x}</div>):<div className="muted">No work experience yet.</div>}</div></div>}
  </div>;
}
