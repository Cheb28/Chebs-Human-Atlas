import { COUNTRY_BY_ID } from '../../engine/countries.js';
import { netWorth } from '../../engine/advance.js';
import { jobTitle } from '../../engine/jobs.js';
import { titleCase, money } from '../format.js';
import { displayName } from '../../engine/names.js';
import { bmiClassification, lifeConditionSummary, needsAttention } from '../../engine/lifeState.js';
import DecisionBanner from '../DecisionBanner.jsx';

const measurementText=recorded=>recorded?`${recorded.heightCm.toFixed(0)} cm · ${recorded.weightKg.toFixed(1)} kg · BMI ${recorded.bmi.toFixed(1)} (${bmiClassification(recorded.bmi)})`:'No measurement recorded';
export default function Overview({state,refresh,onNavigate}){
  const ch=state.character,country=COUNTRY_BY_ID[ch.countryId],w=lifeConditionSummary(ch),attention=needsAttention(ch),recorded=ch.lifeState?.body?.recorded;
  return <div>
    {(ch.pendingDecisions?.length||0)>0&&<div className="panel"><h3>Unresolved Decisions</h3><p className="muted">These choices apply when you age a year. A default is shown if you leave one unresolved.</p><DecisionBanner state={state} refresh={refresh}/></div>}
    <div className="grid cols-2">
      <div className="panel"><h3>Life Condition</h3><div className="kv"><span>Physical condition</span><span>{w.physicalCondition} · {w.physicalTrend}</span></div><div className="kv"><span>Daily function</span><span>{w.function}</span></div><div className="kv"><span>Emotional state</span><span>{w.emotionalState}</span></div><div className="kv"><span>Life satisfaction</span><span>{w.lifeSatisfaction}</span></div><div className="kv"><span>Stress</span><span>{w.stress}</span></div><div className="kv"><span>Energy</span><span>{w.energy}</span></div><div className="kv"><span>Time</span><span>{w.time}</span></div>{w.reasons?.length>0&&<p className="muted">Main influences: {w.reasons.join(', ')}.</p>}<div className="kv"><span>Last recorded body measurement</span><span>{measurementText(recorded)}{recorded?` · age ${recorded.age}`:''}</span></div></div>
      <div className="panel"><h3>Who You Are</h3><div className="kv"><span>Name</span><span>{displayName(ch)}</span></div><div className="kv"><span>Age</span><span>{ch.age}</span></div><div className="kv"><span>Location</span><span>{ch.location.name}, {country.name}</span></div><div className="kv"><span>Citizenship(s)</span><span>{(ch.immigration?.citizenships||[ch.countryId]).map(id=>COUNTRY_BY_ID[id]?.name||id).join(', ')}</span></div><div className="kv"><span>Work</span><span>{ch.job?jobTitle(ch.job):titleCase(ch.employmentStatus)}</span></div><div className="kv"><span>Family succession</span><span>#{state.successionNumber||state.generation||1}</span></div><div className="kv"><span>Net worth</span><span>{money(netWorth(ch))}</span></div><button onClick={()=>onNavigate('places')}>Open country, map and travel</button></div>
      <div className="panel"><h3>Needs Attention</h3>{attention.length===0?<div className="muted">Nothing urgent is waiting for you.</div>:attention.map(x=><button key={x.id} className="attention-button" onClick={()=>onNavigate(x.target)}>{x.label} →</button>)}</div>
      <div className="panel"><h3>Life Log</h3><div className="log">{[...state.log].reverse().map((entry,i)=>entry.lines.length===0?null:<div key={i}>{entry.lines.map((line,j)=><div className="yr" key={j}><span className="age">Age {entry.age}</span><span className="txt">{line}</span></div>)}</div>)}</div></div>
      {(state.dynastyHistory||[]).length>0&&<div className="panel"><h3>Family Succession History</h3>{state.dynastyHistory.map(x=><div className="kv" key={x.succession}><span>#{x.succession} · {titleCase(x.relation)}</span><span>{x.from} → {x.to} · {money(x.inheritance)}</span></div>)}</div>}
    </div>
  </div>;
}
