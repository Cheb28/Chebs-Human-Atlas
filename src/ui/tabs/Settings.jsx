import { useState } from 'react';
import { getSaveSettings, setAutosaveInterval } from '../../engine/saves.js';

export default function Settings({saveTools,onNotice}){
  const [interval,setInterval]=useState(()=>getSaveSettings().autosaveInterval);
  const update=value=>{try{const saved=setAutosaveInterval(value);setInterval(saved);onNotice?.({message:saved===0?'Autosaving disabled.':`Autosaving set to every ${saved} year${saved===1?'':'s'}.`});}catch(e){onNotice?.({message:e.message,bad:true});}};
  return <div className="grid cols-2">
    <section className="panel"><h3>Autosave Settings</h3><div className="field"><label htmlFor="autosave-interval">Automatically save</label><select id="autosave-interval" value={interval} onChange={e=>update(Number(e.target.value))}><option value="0">Off</option><option value="1">Every year</option><option value="5">Every 5 years</option><option value="10">Every 10 years</option></select></div><p className="muted">Manual saves and JSON export remain available regardless of this setting. The three newest automatic saves are retained.</p></section>
    {saveTools}
  </div>;
}
