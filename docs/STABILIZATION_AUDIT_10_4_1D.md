# Pre-10.4.1D Stabilization Audit

Date: 2026-07-14

## Scope

This pass tested the one-year turn pipeline across health, mortality, education, employment,
business, household finance, tax, family/social life, religion, adult health, crime, prison,
immigration, transportation, utilities, travel documents, death, estates, and succession. The new
stress suite runs 72 deliberately varied lives plus one complete smoke life in every playable
country. It checks finite state, non-negative accounts and debts, hard adult-age boundaries, exact
one-year advancement, and eventual modeled death.

## Critical findings — resolved

1. A legal migration application filed before a criminal charge could finish after the charge,
   bypassing the departure block. Every pending application is now revalidated immediately before
   departure and cancelled when a new criminal restriction applies.
2. A fugitive deported or otherwise returned to the warrant country could remain marked as a
   fugitive without the criminal case restarting. Return now causes arrest and restores the case.

## Major findings — resolved

1. The judicial system jumped directly from detection to charge and had no investigation, exit
   restriction, warrant, fugitive, or extradition state. Serious investigations can now impose an
   exit restriction; lower-level investigations may permit departure; leaving does not erase the
   investigation; evidence can later create a warrant.
2. Extradition did not exist. Serious ordinary-law warrants now create annual international return
   risk. EU/EEA surrender is modeled as stronger cooperation. Local citizenship can reduce ordinary
   extradition probability outside that system. Culturally specific, political, private/family, and
   low-severity offences do not automatically become internationally extraditable.
3. The old all-purpose active-case check incorrectly treated civil litigation like a criminal travel
   ban. Civil cases no longer prevent migration. A pending criminal charge blocks legal departure,
   while attempted irregular flight creates fugitive status and a warrant. Prison, military service,
   and parole still block departure.
4. Germany and Japan had typical simulated median death ages roughly ten years above their modeled
   life expectancy. Baseline mortality calibration now accounts for their unusually low generated
   disease burden, and the calibration test is enforced instead of merely printing a warning.

## Minor findings — resolved

1. Passport applications could be started despite an active criminal charge, serious exit-restricted
   investigation, or warrant. Those applications are now refused.
2. Crime and bankruptcy actions could be called directly while investigated or wanted even though
   the interface implied they were unavailable. Engine-level checks now match the interface.
3. Law did not explain investigation, travel-restriction, warrant, or extradition status. The status
   panel now presents each explicitly.
4. Earlier migration tests assumed transport careers remained deferred and an exact older career
   count. The assertions now reflect the approved transportation careers.

## Deliberate simplifications and later work

- Extradition is a national-tier simulation, not a complete bilateral treaty matrix. INTERPOL Red
  Notices are treated as cooperation requests rather than international arrest warrants, consistent
  with INTERPOL's official explanation: https://www.interpol.int/en/How-we-work/Notices/Red-Notices
- The European Arrest Warrant is represented by a higher annual surrender probability within the
  modeled EU/EEA group, based on the European Commission overview:
  https://commission.europa.eu/law/cross-border-cases/judicial-cooperation/types-judicial-cooperation/european-arrest-warrant_en
- Investigation, surrender, and extradition take whole-year turns. Bail hearings, airport transit,
  tourism, and month-level court deadlines are not simulated because one click always equals one
  year.
- The large lazy-loaded MapLibre map chunk remains a performance warning, not a correctness or
  deployment failure. It belongs in a later performance pass.

## Verification gate

Phase 10.4.1D should not begin unless the complete test command, the stabilization suite, production
build, and repository cleanliness checks all pass.
