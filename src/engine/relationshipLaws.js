const MARRIAGE = new Set([
  'Andorra','Argentina','Aruba','Australia','Austria','Belgium','Brazil','Canada','Chile','Colombia',
  'Costa Rica','Cuba','Curacao','Denmark','Ecuador','Estonia','Finland','France','Germany','Greece',
  'Iceland','Ireland','Liechtenstein','Luxembourg','Malta','Mexico','Netherlands','New Zealand','Norway',
  'Portugal','Slovenia','South Africa','Spain','Sweden','Switzerland','Taiwan','Thailand','United Kingdom',
  'United States','Uruguay',
]);

const CIVIL_RECOGNITION = new Set([
  'Bolivia','Croatia','Cyprus','Czechia','Hungary','Israel','Italy','Latvia','Monaco','Montenegro',
  'San Marino',
]);

const CRIMINALIZED = new Set([
  'Afghanistan','Algeria','Bangladesh','Brunei','Burundi','Cameroon','Chad','Comoros','Egypt','Eritrea',
  'Eswatini','Ethiopia','The Gambia','Ghana','Guinea','Guyana','Iran','Iraq','Jamaica','Kenya','Kiribati',
  'Kuwait','Lebanon','Liberia','Libya','Malawi','Malaysia','Maldives','Mauritania','Morocco','Burma',
  'Nigeria','Oman','Pakistan','Qatar','Saint Lucia','Saudi Arabia','Senegal','Sierra Leone','Somalia',
  'South Sudan','Sri Lanka','Sudan','Syria','Tanzania','Togo','Tonga','Tunisia','Turkmenistan','Uganda',
  'United Arab Emirates','Uzbekistan','Yemen','Zambia','Zimbabwe','North Korea',
]);

export function relationshipLawProfile(country) {
  if (MARRIAGE.has(country.name)) return {
    status: 'marriage', label: 'Same-sex marriage recognized', marriageAllowed: true,
    adoptionAllowed: country.lawTier !== 'weak', fosterAllowed: true, safetyRisk: 0,
    note: 'The simulation recognizes civil marriage for same-sex couples in this country profile.',
  };
  if (CIVIL_RECOGNITION.has(country.name)) return {
    status: 'civil', label: 'Limited legal recognition', marriageAllowed: false,
    adoptionAllowed: false, fosterAllowed: country.lawTier === 'strong', safetyRisk: .03,
    note: 'A partnership may receive limited recognition, but the simulation does not treat it as full marriage.',
  };
  if (CRIMINALIZED.has(country.name)) return {
    status: 'criminalized', label: 'Same-sex relationships criminalized or actively prosecuted', marriageAllowed: false,
    adoptionAllowed: false, fosterAllowed: false, safetyRisk: .16,
    note: 'Open same-sex relationships face serious legal and personal-safety risks in this country profile.',
  };
  return {
    status: 'legal-unrecognized', label: 'Legal but not nationally recognized', marriageAllowed: false,
    adoptionAllowed: false, fosterAllowed: country.lawTier === 'strong', safetyRisk: .02,
    note: 'Same-sex relationships are modeled as legal but without national marriage recognition.',
  };
}

export function isSameSexCouple(ch, other) {
  return !!other && ch.sex === other.sex;
}

export function canMarry(ch, partner, country) {
  return !isSameSexCouple(ch, partner) || relationshipLawProfile(country).marriageAllowed;
}
