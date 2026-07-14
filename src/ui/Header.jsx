import { money } from './format.js';
import { netWorth } from '../engine/advance.js';
import { displayName } from '../engine/names.js';
import { lifeConditionSummary } from '../engine/lifeState.js';

export default function Header({character}){
  const w=lifeConditionSummary(character);
  return <div className="header"><div className="who"><span className="name">{character.sex==='male'?'♂':'♀'} {displayName(character)}, age {character.age}</span><span className="loc">{character.location.name}, {character.countryName}</span></div><div className="condition-chip" title="Current physical condition">{w.physicalCondition}</div><div className="condition-chip" title="Current emotional state">{w.emotionalState}</div><div className="cash" title="Total net worth">{money(netWorth(character))}</div><div className="spacer"/></div>;
}
