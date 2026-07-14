import { medianWage } from './countries.js';
import { addBusinessYear, ensureExperience } from './experience.js';

export function resolveBusiness(ch, country, rng) {
  const b = ch.business;
  if (!b) return { income: 0, logs: [] };
  const mw = medianWage(country);
  const climate = 0.8 + (country.bizClimate || 1) * 0.1;
  const experience=ensureExperience(ch);
  const productiveCapital = Math.max(0, b.capital);
  const revenue = productiveCapital * rng.float(0.9, 1.4)
    * (1 + Math.min(.5,experience.businessYears*.035+experience.profitableBusinessYears*.015+experience.training.business*.02)) * climate;
  const wages = b.employees * mw;
  const interest = b.loan * 0.10;
  const profit = revenue - wages - interest;
  addBusinessYear(ch,profit>0);
  b.lastRevenue = revenue;
  b.lastWages = wages;
  b.lastInterest = interest;
  b.lastProfit = profit;
  b.capital += profit;
  const logs = [];
  if (b.capital <= 0) {
    const unpaid = Math.max(0, b.loan - Math.max(0, b.capital));
    ch.debts.business = (ch.debts.business || 0) + unpaid;
    ch.business = null;
    if (ch.judicial) ch.judicial.bankruptcyDue = unpaid;
    logs.push('Your business became insolvent and closed. Unpaid guaranteed debt became personal debt.');
  }
  return { income: profit, logs };
}
