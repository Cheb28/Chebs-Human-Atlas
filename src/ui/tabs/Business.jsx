import { COUNTRY_BY_ID, medianWage } from '../../engine/countries.js';
import { foundBusiness, hireEmployee, takeBusinessLoan, sellBusiness } from '../../engine/actions.js';
import { money } from '../format.js';

export default function Business({ state, refresh, actionFeedback }) {
  const ch = state.character;
  const country = COUNTRY_BY_ID[ch.countryId];
  const b = ch.business;
  const mw = medianWage(country);
  const act = (fn,success) => actionFeedback ? actionFeedback(fn,{success}) : (fn(),refresh());

  return <div className="grid cols-2">
    <div className="panel">
      <h3>Your Business</h3>
      {!b ? <>
        <p className="muted">Start with savings. Results change yearly with your business skill and the local business climate.</p>
        <button title={ch.age<18?'Available at age 18.':ch.money.bank<mw*.5?'Not enough personal savings.':''} disabled={ch.age < 18 || ch.money.bank < mw * 0.5} onClick={() => act(() => foundBusiness(state, 'informal'),'Your informal business started.')}>
          Start informal stall ({money(mw * 0.5)})
        </button>{' '}
        <button title={ch.age<18?'Available at age 18.':ch.money.bank<mw*5?'Not enough personal savings.':''} disabled={ch.age < 18 || ch.money.bank < mw * 5} onClick={() => act(() => foundBusiness(state, 'registered'),'Your registered business started.')}>
          Register business ({money(mw * 5)})
        </button>
      </> : <>
        <div className="kv"><span className="k">Type</span><span className="v">{b.type === 'informal' ? 'Informal stall' : 'Registered business'}</span></div>
        <div className="kv"><span className="k">Business capital</span><span className="v">{money(b.capital)}</span></div>
        <div className="kv"><span className="k">Employees</span><span className="v">{b.employees}</span></div>
        <div className="kv"><span className="k">Business loan</span><span className="v">{money(b.loan)}</span></div>
        <div className="kv"><span className="k">Last revenue</span><span className="v">{money(b.lastRevenue || 0)}</span></div>
        <div className="kv"><span className="k">Employee wages</span><span className="v">−{money(b.lastWages || 0)}</span></div>
        <div className="kv"><span className="k">Loan interest</span><span className="v">−{money(b.lastInterest || 0)}</span></div>
        <div className="kv"><span className="k">Last profit/loss</span><span className="v" style={{ color: b.lastProfit >= 0 ? 'var(--good)' : 'var(--bad)' }}>{money(b.lastProfit || 0)}</span></div>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => act(() => hireEmployee(state),'An employee was hired; wages begin with the next yearly statement.')}>Hire employee</button>{' '}
          <button title={country.incomeTier<2?'Formal business lending is unavailable in this country profile.':''} disabled={country.incomeTier < 2} onClick={() => act(() => takeBusinessLoan(state),'The business loan was added to company capital.')}>Take 10% loan</button>{' '}
          <button onClick={() => act(() => sellBusiness(state),'The business was sold and net proceeds moved to personal savings.')}>Sell business</button>
        </div>
      </>}
    </div>
    <div className="panel">
      <h3>Local Conditions</h3>
      <div className="kv"><span className="k">Business climate</span><span className="v">Tier {country.bizClimate || 1}</span></div>
      <div className="kv"><span className="k">Typical annual wage</span><span className="v">{money(mw)}</span></div>
      <p className="muted" style={{ fontSize: 12 }}>Each employee costs roughly one typical wage per year. A weak year can consume capital; insolvency closes the business and personally guaranteed unpaid debt remains.</p>
    </div>
  </div>;
}
