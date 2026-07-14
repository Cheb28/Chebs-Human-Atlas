import { useMemo, useState } from 'react';
import { COUNTRY_BY_ID } from '../../engine/countries.js';
import {
  addressConduct, convertOrLeaveReligion, requestLifetimePilgrimage,
  updatePrivateBelief, updateReligionCommitment, updateReligiousBranch,
  updateReligiousCareer, updateReligiousCharity, updateReligiousCommunity,
} from '../../engine/actions.js';
import {
  branchOptions, CHARITY_PURPOSES, ensureReligionState, FIQH_OPTIONS,
  interfaithStatus, observanceLabel, pietyLabel, PRIVATE_BELIEFS, RELIGIOUS_COMMITMENTS,
  religiousLegacy,
} from '../../engine/religion.js';
import { money } from '../format.js';

const TABS = [
  ['overview', 'Overview'], ['observance', 'Observance'], ['beliefs', 'Beliefs'],
  ['charity', 'Charity'], ['conduct', 'Conduct & Reconciliation'],
  ['community', 'Community & Family'], ['career', 'Career'], ['legacy', 'Legacy'],
];

const CAREERS = ['Community religious leader', 'Clergy or worship leader', 'Religious teacher or scholar', 'Chaplain', 'Monastic vocation', 'Religious charity worker'];

export default function Religion({ state, refresh }) {
  const ch = state.character, country = COUNTRY_BY_ID[ch.countryId], religion = ensureReligionState(ch);
  const [section, setSection] = useState('overview');
  const [publicTarget, setPublicTarget] = useState(religion.publicIdentity);
  const [privateTarget, setPrivateTarget] = useState(religion.privateIdentity);
  const options = useMemo(() => [...new Set(['None', religion.publicIdentity, religion.privateIdentity, ...(country.religions || []).map(x => x.name)])].filter(Boolean), [country, religion.publicIdentity, religion.privateIdentity]);
  const transact = fn => { const result = fn(); refresh(); return result; };
  const interfaith = interfaithStatus(ch), legacy = religiousLegacy(ch);
  const recent = [...religion.annualHistory].reverse().slice(0, 8);
  const autonomous = ch.age >= (religion.upbringing.autonomyAge || 16);

  return <div>
    <div className="section-tabs" role="tablist" aria-label="Religion sections">
      {TABS.map(([id, label]) => <button key={id} className={section === id ? 'active' : ''} onClick={() => setSection(id)}>{label}</button>)}
    </div>

    {section === 'overview' && <div className="grid cols-2">
      <div className="panel">
        <h3>Religious identity</h3>
        <div className="kv"><span className="k">Public religion</span><span className="v">{religion.publicIdentity}</span></div>
        <div className="kv"><span className="k">Private belief</span><span className="v">{PRIVATE_BELIEFS[religion.privateBelief]}</span></div>
        <div className="kv"><span className="k">Private identity</span><span className="v">{religion.privateIdentity}</span></div>
        <div className="kv"><span className="k">Tradition</span><span className="v">{religion.tradition}</span></div>
        <div className="kv"><span className="k">Branch or denomination</span><span className="v">{religion.branch}</span></div>
        {religion.tradition === 'Islam' && <div className="kv"><span className="k">Fiqh school</span><span className="v">{religion.fiqhSchool}</span></div>}
      </div>
      <div className="panel">
        <h3>Practice at a glance</h3>
        <div className="kv"><span className="k">Observance</span><span className="v">{observanceLabel(ch)}</span></div>
        <div className="kv"><span className="k">Personal piety</span><span className="v">{pietyLabel(ch)}</span></div>
        <div className="kv"><span className="k">Ongoing commitments</span><span className="v">{Object.values(religion.commitments).filter(Boolean).length}</span></div>
        <div className="kv"><span className="k">Community membership</span><span className="v">{religion.community.member ? 'Active' : 'Not set'}</span></div>
        <div className="kv"><span className="k">Standing charity</span><span className="v">{religion.charity.enabled ? 'Active' : 'Off'}</span></div>
        <div className="kv"><span className="k">Lifetime pilgrimage</span><span className="v">{religion.pilgrimage.completed ? `Completed at age ${religion.pilgrimage.completedAge}` : religion.pilgrimage.planned ? 'Planned' : 'Not completed'}</span></div>
        <p className="muted">Your choices stay active every year until you change them. Routine observance is recorded automatically.</p>
      </div>
    </div>}

    {section === 'observance' && <div className="grid cols-2">
      <div className="panel">
        <h3>Ongoing observance</h3>
        {!autonomous && <div className="notice warn">Your religious upbringing is currently guardian-led. Independent choices become available at age {religion.upbringing.autonomyAge}.</div>}
        {RELIGIOUS_COMMITMENTS.map(item => <label className="check-row" key={item.id}>
          <input type="checkbox" checked={religion.commitments[item.id]} disabled={!autonomous || !religion.privateIdentity || religion.privateIdentity === 'None'} onChange={e => transact(() => updateReligionCommitment(state, item.id, e.target.checked))} />
          <span><strong>{item.label}</strong><br /><span className="muted">{item.description} This remains enabled every year.</span></span>
        </label>)}
      </div>
      <div className="panel">
        <h3>Lifetime practices</h3>
        <div className="kv"><span className="k">Pilgrimage</span><span className="v">{religion.pilgrimage.completed ? `Completed at age ${religion.pilgrimage.completedAge}` : religion.pilgrimage.planned ? 'Planned for the next eligible year' : 'Not planned'}</span></div>
        <button disabled={!autonomous || ch.age < 18 || religion.pilgrimage.completed || religion.pilgrimage.planned} onClick={() => transact(() => requestLifetimePilgrimage(state))}>Plan a once-in-a-lifetime pilgrimage</button>
        <p className="muted">The game checks health, access, and affordability when the next year resolves. Tradition-specific pilgrimages, including Hajj, arrive in the appropriate expansion.</p>
        <h3 style={{ marginTop: 18 }}>Recent yearly record</h3>
        {recent.length === 0 && <div className="muted">No yearly observance has been recorded yet.</div>}
        {recent.map(row => <div className="kv" key={row.age}><span className="k">Age {row.age}</span><span className="v">{row.enabled.length ? `${row.completed.length}/${row.enabled.length} commitments completed` : 'No commitments enabled'}</span></div>)}
      </div>
    </div>}

    {section === 'beliefs' && <div className="grid cols-2">
      <div className="panel">
        <h3>Private belief</h3>
        <label className="field"><span>How you privately believe</span><select value={religion.privateBelief} disabled={!autonomous} onChange={e => transact(() => updatePrivateBelief(state, e.target.value, privateTarget))}>{Object.entries(PRIVATE_BELIEFS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        {religion.privateBelief === 'different' && <label className="field"><span>Private religious identity</span><select value={privateTarget} onChange={e => { setPrivateTarget(e.target.value); transact(() => updatePrivateBelief(state, 'different', e.target.value)); }}>{options.map(x => <option key={x}>{x}</option>)}</select></label>}
        <p className="muted">Private belief is not automatically disclosed to family, employers, government, or the religious community.</p>
      </div>
      <div className="panel">
        <h3>Public affiliation</h3>
        <label className="field"><span>New public religion</span><select value={publicTarget} disabled={!autonomous} onChange={e => setPublicTarget(e.target.value)}>{options.map(x => <option key={x}>{x}</option>)}</select></label>
        <button disabled={!autonomous || publicTarget === religion.publicIdentity} onClick={() => transact(() => convertOrLeaveReligion(state, publicTarget))}>{publicTarget === 'None' ? 'Publicly leave religion' : 'Make public conversion or affiliation'}</button>
        <p className="muted">A public change may affect family and community relationships. Detailed country laws and tradition-specific processes are added in later religion expansions.</p>
        <h3 style={{ marginTop: 18 }}>Branch and interpretation</h3>
        <label className="field"><span>Sect, branch, or denomination</span><select value={religion.branch} onChange={e => transact(() => updateReligiousBranch(state, e.target.value, religion.fiqhSchool))}>{branchOptions(religion.tradition).map(x => <option key={x}>{x}</option>)}</select></label>
        {religion.tradition === 'Islam' && <label className="field"><span>Fiqh school</span><select value={religion.fiqhSchool} onChange={e => transact(() => updateReligiousBranch(state, religion.branch, e.target.value))}>{FIQH_OPTIONS.map(x => <option key={x}>{x}</option>)}</select></label>}
      </div>
    </div>}

    {section === 'charity' && <div className="grid cols-2">
      <div className="panel">
        <h3>Standing yearly charity instruction</h3>
        <label className="check-row"><input type="checkbox" checked={religion.charity.enabled} disabled={ch.age < 16} onChange={e => transact(() => updateReligiousCharity(state, { enabled: e.target.checked }))} /><span><strong>Keep giving every year until I turn this off</strong><br /><span className="muted">This does not need to be checked again next year.</span></span></label>
        <label className="field"><span>Calculation</span><select value={religion.charity.mode} onChange={e => transact(() => updateReligiousCharity(state, { mode: e.target.value }))}><option value="fixed">Fixed amount</option><option value="percent">Percentage of annual earned income</option></select></label>
        {religion.charity.mode === 'fixed'
          ? <label className="field"><span>Annual amount</span><input type="number" min="0" value={religion.charity.amount} onChange={e => transact(() => updateReligiousCharity(state, { amount: e.target.value }))} /></label>
          : <label className="field"><span>Annual percentage</span><input type="number" min="0" max="100" step="0.5" value={religion.charity.percent} onChange={e => transact(() => updateReligiousCharity(state, { percent: e.target.value }))} /></label>}
        <label className="field"><span>Purpose</span><select value={religion.charity.purpose} onChange={e => transact(() => updateReligiousCharity(state, { purpose: e.target.value }))}>{CHARITY_PURPOSES.map(x => <option key={x}>{x}</option>)}</select></label>
        <label className="field"><span>Pay from</span><select value={religion.charity.source} onChange={e => transact(() => updateReligiousCharity(state, { source: e.target.value }))}><option value="personal">Personal funds</option><option value="household">Household fund</option></select></label>
      </div>
      <div className="panel">
        <h3>Giving history</h3>
        <div className="kv"><span className="k">Lifetime giving</span><span className="v">{money(religion.charity.lifetimeGiven)}</span></div>
        {[...religion.charity.history].reverse().slice(0, 12).map((x, i) => <div className="kv" key={`${x.age}-${i}`}><span className="k">Age {x.age} · {x.purpose}</span><span className="v">{x.status === 'completed' ? money(x.amount) : x.status}</span></div>)}
        {religion.charity.history.length === 0 && <div className="muted">No giving has been processed yet.</div>}
        <p className="muted">Completed donations appear in the annual financial statement. Specific rules for zakat, tithing, sadaqah, tzedakah, dana, sewa, deductions, and charitable wills come later.</p>
      </div>
    </div>}

    {section === 'conduct' && <div className="panel">
      <h3>Conduct and reconciliation</h3>
      <p className="muted">This records significant conduct over a lifetime without declaring that the character is a bad person. Later tradition expansions determine what is considered a sin and how confession, repentance, restitution, forgiveness, or reconciliation applies.</p>
      {religion.conduct.length === 0 && <div className="muted">No significant conduct requiring reconciliation has been recorded.</div>}
      {[...religion.conduct].reverse().map(entry => <div className="subcard" key={entry.id}>
        <div className="kv"><span className="k">Age {entry.age} · {entry.category}</span><span className="v">{entry.status}</span></div>
        <p>{entry.description}</p>
        {entry.status === 'unresolved' ? <div className="button-row">
          <button onClick={() => transact(() => addressConduct(state, entry.id, 'Private reflection and repentance'))}>Private repentance</button>
          <button onClick={() => transact(() => addressConduct(state, entry.id, 'Apology or restitution'))}>Apology or restitution</button>
          <button onClick={() => transact(() => addressConduct(state, entry.id, 'Formal religious reconciliation'))}>Formal religious practice</button>
        </div> : <div className="muted">Addressed at age {entry.reconciliation?.age}: {entry.reconciliation?.method}</div>}
      </div>)}
    </div>}

    {section === 'community' && <div className="grid cols-2">
      <div className="panel">
        <h3>Religious community</h3>
        <label className="check-row"><input type="checkbox" checked={religion.community.member} disabled={!autonomous} onChange={e => transact(() => updateReligiousCommunity(state, e.target.checked))} /><span><strong>Belong to a religious community</strong></span></label>
        <div className="kv"><span className="k">Community standing</span><span className="v">{religion.community.standing >= 75 ? 'Respected' : religion.community.standing >= 45 ? 'Ordinary' : 'Strained'}</span></div>
        <p className="muted">Standing is a social relationship measure, not a judgment of personal worth or true belief.</p>
      </div>
      <div className="panel">
        <h3>Upbringing and interfaith family</h3>
        <div className="kv"><span className="k">Childhood upbringing</span><span className="v">{religion.upbringing.guardianReligion}</span></div>
        <div className="kv"><span className="k">Current control</span><span className="v">{religion.upbringing.guardianLed ? 'Guardian-led' : 'Personal choice'}</span></div>
        <div className="kv"><span className="k">Civil relationship</span><span className="v">{interfaith.civil}</span></div>
        <div className="kv"><span className="k">Religious recognition</span><span className="v">{interfaith.religious}</span></div>
        {interfaith.partnerReligion && <div className="kv"><span className="k">Partner's religion</span><span className="v">{interfaith.partnerReligion}</span></div>}
        {(ch.family || []).filter(x => x.relation === 'Child').map(child => <div className="kv" key={child.id}><span className="k">{child.name || `Child ${child.childNumber}`} upbringing</span><span className="v">{child.religiousUpbringing?.publicReligion || child.religion || religion.publicIdentity}{child.religiousUpbringing?.parentsAgree === false ? ' · parents differ' : ''}</span></div>)}
        <p className="muted">Civil validity and religious recognition are deliberately separate. Detailed interfaith marriage rules arrive with each tradition.</p>
      </div>
    </div>}

    {section === 'career' && <div className="grid cols-2">
      <div className="panel">
        <h3>Religious vocation</h3>
        <label className="check-row"><input type="checkbox" checked={religion.career.interested} disabled={ch.age < 16} onChange={e => transact(() => updateReligiousCareer(state, e.target.checked, religion.career.path))} /><span><strong>Pursue religious-career preparation</strong></span></label>
        <label className="field"><span>Broad path</span><select value={religion.career.path} onChange={e => transact(() => updateReligiousCareer(state, religion.career.interested, e.target.value))}>{CAREERS.map(x => <option key={x}>{x}</option>)}</select></label>
        <div className="kv"><span className="k">Preparation years</span><span className="v">{religion.career.preparationYears}</span></div>
        <p className="muted">Enable Religious study under Observance to build preparation. Tradition-specific qualifications and actual career entry arrive in later expansions.</p>
      </div>
      <div className="panel"><h3>Framework status</h3><p>The game now preserves religious vocation interest, preparation, tradition, branch, and life history. It does not yet treat a generic religious role as interchangeable with a priest, imam, rabbi, chaplain, monk, nun, scholar, or other specific vocation.</p></div>
    </div>}

    {section === 'legacy' && <div className="grid cols-2">
      <div className="panel">
        <h3>Religious and charitable legacy</h3>
        <div className="kv"><span className="k">Public identity</span><span className="v">{legacy.publicIdentity}</span></div>
        <div className="kv"><span className="k">Private identity</span><span className="v">{legacy.privateIdentity}</span></div>
        <div className="kv"><span className="k">Observance</span><span className="v">{legacy.observance}</span></div>
        <div className="kv"><span className="k">Personal piety</span><span className="v">{legacy.piety}</span></div>
        <div className="kv"><span className="k">Years with commitments</span><span className="v">{legacy.activeYears}</span></div>
        <div className="kv"><span className="k">Lifetime charity</span><span className="v">{money(legacy.lifetimeGiven)}</span></div>
        <div className="kv"><span className="k">Conduct addressed</span><span className="v">{legacy.addressedConduct}</span></div>
      </div>
      <div className="panel"><h3>How this life may be remembered</h3><p>{legacy.summary}</p><p className="muted">This describes recorded actions and community memory. The game does not declare supernatural rewards, punishment, salvation, or a confirmed afterlife outcome.</p></div>
    </div>}
  </div>;
}
