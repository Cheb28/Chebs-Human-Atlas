import { medianWage } from './countries.js';
import { addBusinessYear, ensureExperience } from './experience.js';

export function resolveBusiness(ch, country, rng) {
  const b = ch.business;
  if (!b) return { income: 0, valueChange:0, logs: [] };
  const mw = medianWage(country);
  const climate = .82+(country.bizClimate||1)*.07+Math.max(-.08,Math.min(.08,(country.gdpGrowth||2)/100));
  const experience=ensureExperience(ch);
  const productiveCapital = Math.max(0, b.capital);
  const experienceBonus=1+Math.min(.30,experience.businessYears*.012+experience.profitableBusinessYears*.006+experience.training.business*.015);
  const ownerCapacity=mw*(b.type==='registered' ? .95 : .55),employeeCapacity=b.employees*mw*rng.float(.75,1.15);
  const revenue=(ownerCapacity+employeeCapacity+productiveCapital*rng.float(.18,.38))*experienceBonus*climate;
  const wages = b.employees * mw;
  const interest = b.loan * 0.10;
  const operatingCosts=revenue*rng.float(b.type==='registered' ? .42 : .30,b.type==='registered' ? .64 : .52);
  const profit = revenue-operatingCosts-wages-interest;
  addBusinessYear(ch,profit>0);
  b.lastRevenue = revenue;
  b.lastWages = wages;
  b.lastInterest = interest;
  b.lastProfit = profit;
  const ownerDraw=profit>0 ? profit*(b.type==='registered' ? .45 : .65) : 0;
  const retained=profit-ownerDraw;
  b.capital += retained;
  const logs = [];
  if (b.capital <= 0) {
    const unpaid = Math.max(0, b.loan - Math.max(0, b.capital));
    ch.debts.business = (ch.debts.business || 0) + unpaid;
    ch.business = null;
    if (ch.judicial) ch.judicial.bankruptcyDue = unpaid;
    logs.push('Your business became insolvent and closed. Unpaid guaranteed debt became personal debt.');
  }
  return { income: ownerDraw, valueChange:retained, logs };
}
