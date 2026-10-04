// Ports the session generator embedded in the original salen-mora-plan.html
// (the T template functions + W week table) into data producing the shared
// Session[] shape, instead of generating DOM on load. Run with:
//   npm run build:salen-mora
// to (re)write seed/salen-mora.json.
import { writeFileSync } from 'node:fs';
import type { PlanDocument, Session, Sport, StrengthBlock } from '../src/models/types.js';

const fmt = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}`);
const D = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const iso = (dt: Date) => dt.toISOString().slice(0, 10);
const add = (s: string, n: number) => {
  const d = D(s);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};

const RACE = '2027-03-01';
const SNOWFB = 'Ingen snö där du är? Kör samma pass på rullskidor.';

const STR: Record<string, StrengthBlock> = {
  A: {
    title: 'Styrka A – försiktig start',
    durationMin: 23,
    items: [
      'Dead bug 2 × 8 per sida. Andas ut när benet sträcks, ländryggen kvar mot golvet.',
      'Höftlyft (glute bridge) 2 × 12.',
      'Clamshells 2 × 15 per sida.',
      'Sidoliggande benlyft med övre benet 2 × 12 per sida.',
      'Sidoliggande benlyft med undre benet (insida lår) 2 × 10 per sida, lätt och kontrollerat.',
      'Sidoplanka på knä 2 × 20 sek per sida.',
      'Knäböj med kroppsvikt 2 × 12.',
      'Enbensbalans 3 × 30 sek per ben, gärna sista varvet med slutna ögon.',
    ],
    note: 'Håll inte andan och krysta inte. Det ska kännas i musklerna, aldrig i ljumsken.',
  },
  B: {
    title: 'Styrka B – skejtstyrka',
    durationMin: 30,
    items: [
      'Bulgarisk utfallsknäböj 3 × 8 per ben.',
      'Sidoutfall 3 × 8 per sida.',
      'Copenhagen-planka med böjt knä 3 × 15–20 sek per sida. Börja kort, öka först när det känns stabilt.',
      'Pallof press med gummiband 3 × 10 per sida.',
      'Planka 3 × 40 sek.',
      'Skejthopp i sidled 3 × 10 per sida. Mjuka landningar, stå still en sekund på varje ben.',
      'Rygglyft 3 × 12.',
      'Dips mot bänk eller smala armhävningar 3 × 10, för stavisättningen.',
    ],
    note: 'Andas genom rörelserna. Bålen ska spännas, inte tryckas ut.',
  },
  C: {
    title: 'Styrka C – underhåll',
    durationMin: 20,
    items: [
      'Utfallsknäböj 2 × 8 per ben.',
      'Copenhagen-planka 2 × 20 sek per sida.',
      'Pallof press 2 × 10 per sida.',
      'Planka 2 × 45 sek.',
      'Skejthopp i sidled 2 × 10 per sida.',
      'Dips eller smala armhävningar 2 × 10.',
    ],
    note: 'Lägg den efter ett lugnt pass, inte dagen före intervaller.',
  },
};

interface Built {
  title: string;
  durationMin: number;
  intensity?: string;
  sport: Sport;
  steps: string[];
  purpose?: string;
  fb?: boolean;
  stak?: boolean;
  race?: boolean;
  templateType: string;
}

const T: Record<string, (...args: any[]) => Built> = {
  lopLugn: (m: number) => ({
    title: 'Lugn löpning',
    durationMin: m,
    intensity: 'Lugnt, zon 2',
    sport: 'running',
    steps: [
      '5–10 min rask gång eller mycket lätt jogg.',
      `Spring cirka ${m - 10} min i ett tempo där du kan prata i hela meningar.`,
      'Avsluta med 5 min gång och lite rörlighet för höfter och vader.',
    ],
    purpose: 'Bygger den aeroba grunden som ska bära dig hela vägen till Mora.',
    templateType: 'lopLugn',
  }),
  lopFart: (m: number, n: number) => ({
    title: 'Löpning med fartökningar',
    durationMin: m,
    intensity: 'Lugnt + korta stegringar',
    sport: 'running',
    steps: [
      '15 min lugn löpning som uppvärmning.',
      `${n} × 20 sek fartökning upp mot ungefär 85 % av maxfart. Jogga lugnt 1–2 min mellan varje.`,
      `Spring resten lugnt, totalt cirka ${fmt(m)}.`,
    ],
    purpose: 'Håller igång benens snabbhet och ett effektivt steg utan att det tär.',
    templateType: 'lopFart',
  }),
  cykel: (m: number) => ({
    title: 'Lugn cykling',
    durationMin: m,
    intensity: 'Lugnt, zon 2',
    sport: 'cycling',
    steps: [
      'Cykla lugnt de första 10 minuterna.',
      `Håll jämn, lugn ansträngning resten av passet, totalt ${fmt(m)}.`,
      'Undvik att stå upp och trycka i branta backar.',
    ],
    purpose: 'Kondition med låg belastning, och bra omväxling mot löpningen.',
    templateType: 'cykel',
  }),
  langLop: (m: number) => ({
    title: 'Långpass löpning',
    durationMin: m,
    intensity: 'Lugnt, zon 1–2',
    sport: 'running',
    steps: [
      'Starta lugnare än du tror, de första 15 minuterna ska kännas nästan för lätta.',
      `Spring ${fmt(m)} i jämn, lugn fart.`,
      'Drick regelbundet och ta med något att äta om passet blir längre än 75 min.',
    ],
    purpose: 'Ökar uthålligheten, grunden för ett 90-kilometerslopp.',
    templateType: 'langLop',
  }),
  langCykel: (m: number) => ({
    title: 'Långpass cykel',
    durationMin: m,
    intensity: 'Lugnt, zon 1–2',
    sport: 'cycling',
    steps: [
      'Starta lugnare än du tror, de första 15 minuterna ska kännas nästan för lätta.',
      `Cykla ${fmt(m)} i jämn, lugn fart.`,
      'Drick regelbundet och ta med något att äta om passet blir längre än 75 min.',
    ],
    purpose: 'Ökar uthålligheten, grunden för ett 90-kilometerslopp. Skonar benen lite extra inför veckans övriga pass.',
    templateType: 'langCykel',
  }),
  rsTek: (m: number) => ({
    title: 'Rullskidor – teknik och balans',
    durationMin: m,
    intensity: 'Lugnt',
    sport: 'rollerski',
    steps: [
      '10 min lugn åkning i dubbeldans på plant underlag.',
      'Balans: 4 × 1 min utan stavar. Landa hela vikten på glidskidan och stå kvar på den.',
      'Paddling i lätt motlut: 4 × 1 min lugnt. Jobba med rytmen mellan stavisättning och frånskjut.',
      `Lugn distans resten av tiden, totalt ${fmt(m)}. Växla dubbeldans och enkeldans.`,
    ],
    purpose: 'Skejt är teknikberoende. God balans och full viktöverföring sparar enormt med energi över 90 km.',
    templateType: 'rsTek',
  }),
  rsLugn: (m: number) => ({
    title: 'Rullskidor – lugn distans',
    durationMin: m,
    intensity: 'Lugnt, zon 2',
    sport: 'rollerski',
    steps: [
      '10 min lugn uppvärmning.',
      `${fmt(m - 15)} jämn, lugn åkning. Välj teknik efter terrängen: dubbeldans på flackt, paddling i backar.`,
      '5 min lugnt avslut och stretch av höftböjare och vader.',
    ],
    purpose: 'Aerob volym i rätt rörelse. Ju fler timmar på skidorna, desto mer automatisk blir tekniken.',
    templateType: 'rsLugn',
  }),
  rsInt: (m: number, set: string, rest: string, hard: boolean) => ({
    title: `Rullskidor – intervaller ${set}`,
    durationMin: m,
    intensity: hard ? 'Hårt, zon 4–5' : 'Tröskel, zon 4',
    sport: 'rollerski',
    steps: [
      '15–20 min lugn uppvärmning med 3–4 korta stegringar.',
      `${set} i lätt motlut, med ${rest} lugn åkning emellan. Jämn fart: sista intervallen ska gå lika fort som första.`,
      `Lugn nedvarvning tills passet är totalt cirka ${fmt(m)}.`,
    ],
    purpose: hard
      ? 'Höjer din maximala syreupptagning, taket för hur hårt du kan jobba.'
      : 'Höjer tröskeln, alltså farten du kan hålla länge utan att stumna.',
    templateType: 'rsInt',
  }),
  lopInt: (m: number, set: string, rest: string, hard: boolean) => ({
    title: `Löpintervaller ${set}`,
    durationMin: m,
    intensity: hard ? 'Hårt, zon 4–5' : 'Tröskel, zon 4',
    sport: 'running',
    steps: [
      '15–20 min lugn uppvärmning med 3–4 korta stegringar.',
      `${set} i hårt tempo, gärna i lätt uppförsbacke, med ${rest} lugn jogg emellan. Jämn fart: sista intervallen ska gå lika fort som första.`,
      `Lugn nedvarvning tills passet är totalt cirka ${fmt(m)}.`,
    ],
    purpose: hard
      ? 'Höjer din maximala syreupptagning, taket för hur hårt du kan jobba. Samma fysiologiska stimulans som rullskidintervaller, fast på land.'
      : 'Höjer tröskeln, alltså farten du kan hålla länge utan att stumna. Samma stimulans som rullskidintervaller, fast på land.',
    templateType: 'lopInt',
  }),
  cykelInt: (m: number, set: string, rest: string, hard: boolean) => ({
    title: `Cykelintervaller ${set}`,
    durationMin: m,
    intensity: hard ? 'Hårt, zon 4–5' : 'Tröskel, zon 4',
    sport: 'cycling',
    steps: [
      '15–20 min lugn uppvärmning med 3–4 korta stegringar.',
      `${set} i hårt tempo (högt motstånd eller motlut), med ${rest} lugn trampning emellan. Jämn effekt: sista intervallen ska kännas lika hård som första.`,
      `Lugn nedvarvning tills passet är totalt cirka ${fmt(m)}.`,
    ],
    purpose: hard
      ? 'Höjer din maximala syreupptagning, taket för hur hårt du kan jobba. Samma fysiologiska stimulans som rullskidintervaller, fast på land.'
      : 'Höjer tröskeln, alltså farten du kan hålla länge utan att stumna. Samma stimulans som rullskidintervaller, fast på land.',
    templateType: 'cykelInt',
  }),
  crossInt: (m: number, set: string, rest: string, hard: boolean) => ({
    title: `Crosstrainer – intervaller ${set}`,
    durationMin: m,
    intensity: hard ? 'Hårt, zon 4–5' : 'Tröskel, zon 4',
    sport: 'crosstrainer',
    steps: [
      '15–20 min lugn uppvärmning med stigande motstånd.',
      `${set} i hårt tempo med högt motstånd, med ${rest} lugnt emellan. Jämn fart: sista intervallen ska gå lika hårt som första.`,
      `Lugn nedvarvning tills passet är totalt cirka ${fmt(m)}.`,
    ],
    purpose: hard
      ? 'Höjer din maximala syreupptagning, taket för hur hårt du kan jobba. Helkroppsrörelse som liknar skejt, och du slipper mörker och halka.'
      : 'Höjer tröskeln, alltså farten du kan hålla länge utan att stumna. Helkroppsrörelse som liknar skejt, och du slipper mörker och halka.',
    templateType: 'crossInt',
  }),
  crossEasy: (m: number) => ({
    title: 'Crosstrainer',
    durationMin: m,
    intensity: 'Lugnt, zon 2',
    sport: 'crosstrainer',
    steps: [
      'Kör lugnt de första 10 minuterna.',
      `Håll jämn, lugn ansträngning resten av passet, totalt ${fmt(m)}.`,
      'Variera gärna motstånd eller lutning med jämna mellanrum.',
    ],
    purpose: 'Skonsam konditionsvolym med helkroppsrörelse, en bra skidimitation när ni ändå är inne.',
    templateType: 'crossEasy',
  }),
  rsLang: (m: number) => ({
    title: 'Långpass rullskidor',
    durationMin: m,
    intensity: 'Lugnt, zon 1–2',
    sport: 'rollerski',
    steps: [
      'Starta lugnt, de första 20 minuterna ska kännas nästan för lätta.',
      `Åk ${fmt(m)} i jämn, lugn fart. Välj en slinga där du kan fylla på dryck.`,
      'Alternativ om vägarna är blöta eller mörka: stavgång eller stavlöpning i kuperad terräng.',
    ],
    purpose: 'Uthållighet och fettförbränning, grunden för 90 km.',
    templateType: 'rsLang',
  }),
  snoInt: (m: number, set: string, rest: string, hard: boolean) => ({
    ...T.rsInt(m, set, rest, hard),
    title: `Skejt – intervaller ${set}`,
    sport: 'skate-ski',
    fb: true,
    templateType: 'snoInt',
  }),
  snoLugn: (m: number) => ({ ...T.rsLugn(m), title: 'Skejt – lugn distans', sport: 'skate-ski', fb: true, templateType: 'snoLugn' }),
  snoTek: (m: number) => ({
    ...T.rsTek(m),
    title: 'Skejt – teknik och balans',
    sport: 'skate-ski',
    steps: [
      '10 min lugn åkning i dubbeldans.',
      'Balans: 4 × 1 min utan stavar, gärna i ett lätt utför.',
      'Paddling i motlut: 4 × 1 min. Fokus på höga höfter och ett lugnt, långt frånskjut.',
      '6 × 30 sek i loppfart på flackt med 1 min lugnt emellan.',
      `Lugn distans resten av tiden, totalt ${fmt(m)}.`,
    ],
    fb: true,
    templateType: 'snoTek',
  }),
  snoLang: (m: number) => ({
    ...T.rsLang(m),
    title: 'Långpass skejt',
    sport: 'skate-ski',
    steps: [
      'Starta lugnt, de första 20 minuterna ska kännas nästan för lätta.',
      `Åk ${fmt(m)} i jämn, lugn fart. Lägg slingan så att du passerar bilen eller ett fik för påfyllning.`,
      'Ät och drick var 30–45 min. Använd samma typ av energi som du tänker ha i loppet.',
    ],
    fb: true,
    templateType: 'snoLang',
  }),
  stakIntro: (m: number) => ({
    title: 'Cykel + lätt stakmaskin',
    durationMin: m,
    intensity: 'Lugnt',
    sport: 'ski-erg',
    steps: [
      'Cykla lugnt i 30–35 min, gärna på gymmet.',
      'Stakmaskin 2 × 6 min med lågt motstånd (spjäll 3–4) och 2 min vila emellan. Res dig upp mellan dragen, fäll från höften och låt armarna följa med.',
      'Andas ut i varje drag och undvik att rycka med magen. Avsluta med 5 min lugn cykling.',
    ],
    purpose: 'Vänjer bålen och armarna vid stakrörelsen igen, utan att belasta operationsområdet.',
    stak: true,
    templateType: 'stakIntro',
  }),
  stakGym: (m: number, set: string) => ({
    title: 'Stakmaskin på gymmet',
    durationMin: m,
    intensity: 'Lugnt till medel',
    sport: 'ski-erg',
    steps: [
      '10 min lätt uppvärmning på cykel eller löpband.',
      `Stakmaskin: ${set}, med 2 min lugn stakning eller vila emellan.`,
      `Lugnt på cykeln resten av tiden, totalt cirka ${fmt(m)}. Sedan styrkepasset.`,
    ],
    purpose: 'Stakstyrka och uthållighet i överkroppen, det som bär stavisättningen i skejten. Bra när det är mörkt eller blött ute.',
    stak: true,
    templateType: 'stakGym',
  }),
  genrep: (m: number) => ({
    title: 'Genrep – 5 timmar',
    durationMin: m,
    intensity: 'Lugnt till loppfart',
    sport: 'skate-ski',
    steps: [
      'Åk 5 timmar, gärna ungefär 60 km, i den fart du tänker hålla i Öppet Spår.',
      'Använd exakt de skidor, den valla, de kläder och den mat du ska ha i loppet.',
      'Ät och drick var 30–45 min, som om varje halvtimme vore en kontroll.',
      'Notera hur långt du kommer per timme. Det blir din grund för loppets tidsplan och reptiderna.',
    ],
    purpose: 'Det bästa sättet att hitta problem innan de spelar roll: skav, energi, vallning, kyla.',
    fb: true,
    templateType: 'genrep',
  }),
  aktiv: (m: number) => ({
    title: 'Aktivering',
    durationMin: m,
    intensity: 'Lugnt + några korta ryck',
    sport: 'skate-ski',
    steps: [
      '15 min mycket lugn åkning eller jogg.',
      '3 × 30 sek i loppfart med 1 min lugnt emellan.',
      'Kolla skidor, valla, nummerlapp, kläder och mat för morgondagen.',
    ],
    purpose: 'Får kroppen att vakna utan att trötta. Formen är redan byggd.',
    templateType: 'aktiv',
  }),
  lattUtr: (m: number) => ({
    title: 'Lätt åkning och utrustningskoll',
    durationMin: m,
    intensity: 'Lugnt',
    sport: 'skate-ski',
    steps: [
      '30 min lugn åkning, gärna på loppskidorna.',
      'Testa glid och kläder i den temperatur som är utlovad.',
      'Packa allt du ska ha och lägg fram det.',
    ],
    purpose: 'Lugn i kroppen och i huvudet inför loppet.',
    templateType: 'lattUtr',
  }),
  lopp: () => ({
    title: 'Öppet Spår måndag 90',
    durationMin: 0,
    intensity: 'Din dag',
    sport: 'race',
    race: true,
    steps: [
      'Start i Berga by, Sälen. Startfållorna öppnar 06.00 och startleden går var tionde minut från 07.00. Ditt led avgör din starttid.',
      'Börja lugnare än du tror. Den första backen är lång och det är 90 km kvar.',
      'Ät och drick vid varje kontroll, även när du inte känner dig hungrig.',
      'Reptider (sista passering): Smågan 10.30, Mångsbodarna 12.15, Risberg 13.45, Evertsberg 15.00, Oxberg 16.30, Hökberg 17.40, Eldris 19.00.',
      'Boka Vasaloppsbussen när bokningen öppnar i slutet av november.',
      'Njut av sista biten in mot Mora och kyrktornet.',
    ],
    purpose: 'Allt arbete sedan oktober leder hit.',
    templateType: 'lopp',
  }),
};

const PH = [
  { n: 1, name: 'Rehab-säker grund', dateRange: '4–25 okt', description: 'Lugn kondition, inga tunga lyft, inga rullskidor.' },
  { n: 2, name: 'Återintroduktion', dateRange: '26 okt–15 nov', description: 'Rullskidor och styrka A kommer in, försiktigt.' },
  { n: 3, name: 'Basbygge på rullskidor', dateRange: '16 nov–13 dec', description: 'Intervaller, längre långpass och styrka B.' },
  { n: 4, name: 'Snö och volym', dateRange: '14 dec–7 feb', description: 'Skidor när det finns snö, långpassen växer mot 4 timmar.' },
  { n: 5, name: 'Loppspecifikt och nedtrappning', dateRange: '8 feb–1 mar', description: 'Genrep, sedan mindre volym och kvar med fart.' },
];

// [veckostart, fas, notering, tis, ons, tor, lör, sön]
type WeekRow = [string, number, string, any[], any[], any[], any[], any[]];
const W: WeekRow[] = [
  ['2026-10-05', 1, 'Bara lugn kondition. Inga tunga lyft och inga rullskidor än.', ['lopLugn', 45], ['cykel', 60], ['lopFart', 40, 6], ['langLop', 75], ['lopLugn', 45]],
  ['2026-10-12', 1, '', ['lopLugn', 50], ['cykel', 60], ['lopFart', 45, 8], ['langLop', 90], ['lopLugn', 50]],
  ['2026-10-19', 1, 'Torsdag 22 oktober är det sex veckor sedan operationen. Från nästa vecka börjar styrka och rullskidor.', ['lopLugn', 50], ['cykel', 60], ['lopFart', 45, 8], ['langCykel', 90], ['lopLugn', 45]],
  ['2026-10-26', 2, 'Nya moment: rullskidor, lätt stakmaskin och styrka A. Rullskidor och snö bara på helger, så teknikpasset ligger på söndag. Känn efter i ljumsken dagen efter varje rullskidpass.', ['cykel', 30, 'A'], ['stakIntro', 45], ['lopLugn', 45, 'A'], ['langCykel', 90], ['rsTek', 35]],
  ['2026-11-02', 2, 'Det blir mörkt tidigt nu. Vardagarnas landpass flyttar in på gymmet: cykel och crosstrainer.', ['crossEasy', 40, 'A'], ['stakIntro', 50], ['cykel', 50, 'A'], ['rsLang', 75], ['rsLugn', 45]],
  ['2026-11-09', 2, 'Lättare vecka. Låt kroppen ta in de nya momenten.', ['cykel', 40, 'A'], ['stakIntro', 45], ['crossEasy', 40, 'A'], ['rsLang', 60], ['rsLugn', 45]],
  ['2026-11-16', 3, 'Intervaller och styrka B börjar. Intervallerna körs på cykel eller crosstrainer på vardagarna, rullskidorna sparas till helgen.', ['cykelInt', 60, '5 × 4 min', '2 min', false], ['stakGym', 50, '4 × 5 min lugnt till medel', 'B'], ['crossEasy', 50, 'B'], ['rsLang', 105], ['rsLugn', 60]],
  ['2026-11-23', 3, '', ['crossInt', 65, '6 × 4 min', '2 min', false], ['stakGym', 60, '3 × 10 min lugnt', 'B'], ['cykel', 50, 'B'], ['rsLang', 120], ['rsLugn', 70]],
  ['2026-11-30', 3, '', ['cykelInt', 70, '4 × 6 min', '2 min', true], ['stakGym', 60, '5 × 4 min i medelfart', 'B'], ['crossEasy', 50, 'B'], ['rsLang', 135], ['rsTek', 60]],
  ['2026-12-07', 3, 'Lättare vecka.', ['crossInt', 50, '6 × 2 min', '2 min', true], ['stakGym', 45, '3 × 6 min lugnt', 'B'], ['cykel', 40], ['rsLang', 90], ['rsLugn', 50]],
  ['2026-12-14', 4, 'Byt rullskidor mot snö så fort det går. Fram till dess kör du samma pass på rullskidor. Skidor bara på helger, precis som rullskidorna hittills.', ['cykelInt', 70, '5 × 5 min', '2 min', true], ['cykel', 60, 'C'], ['crossEasy', 60], ['snoLang', 150], ['snoLugn', 75]],
  ['2026-12-21', 4, 'Jul och ledighet: bra läge för längre pass eller några dagar på snö.', ['crossInt', 75, '3 × 10 min', '3 min', false], ['crossEasy', 60, 'C'], ['cykel', 75], ['snoLang', 165], ['snoLugn', 75]],
  ['2026-12-28', 4, '', ['cykelInt', 80, '4 × 8 min', '2 min', false], ['cykel', 60, 'C'], ['crossEasy', 90], ['snoLang', 180], ['snoLugn', 75]],
  ['2027-01-04', 4, 'Lättare vecka.', ['crossInt', 60, '6 × 3 min', '2 min', true], ['crossEasy', 45, 'C'], ['cykel', 45], ['snoLang', 120], ['snoTek', 60]],
  ['2027-01-11', 4, '', ['cykelInt', 85, '3 × 12 min', '3 min', false], ['cykel', 60, 'C'], ['crossEasy', 90], ['snoLang', 195], ['snoLugn', 75]],
  ['2027-01-18', 4, '', ['crossInt', 80, '5 × 6 min', '2 min', true], ['crossEasy', 60, 'C'], ['cykel', 75], ['snoLang', 210], ['snoLugn', 80]],
  ['2027-01-25', 4, 'Längsta långpasset hittills: 4 timmar.', ['cykelInt', 90, '2 × 20 min', '4 min', false], ['cykel', 60, 'C'], ['crossEasy', 90], ['snoLang', 240], ['snoLugn', 75]],
  ['2027-02-01', 4, 'Lättare vecka inför genrepet.', ['crossInt', 60, '6 × 3 min', '2 min', true], ['crossEasy', 45, 'C'], ['cykel', 45], ['snoLang', 150], ['snoTek', 60]],
  ['2027-02-08', 5, 'Genrep på lördag: 5 timmar med loppmat, kläder och skidor.', ['cykelInt', 85, '3 × 15 min i loppfart', '3 min', false], ['cykel', 60, 'C'], ['crossEasy', 75], ['genrep', 300], ['snoLugn', 60]],
  ['2027-02-15', 5, 'Volymen börjar gå ner. Behåll lite fart.', ['crossInt', 70, '4 × 5 min', '2 min', true], ['crossEasy', 50], ['cykel', 60], ['snoLang', 150], ['snoLugn', 60]],
  ['2027-02-22', 5, 'Nedtrappning. Sov, ät och vila. Formen byggs nu.', ['snoInt', 50, '4 × 3 min i loppfart', '2 min', false], ['cykel', 40], ['snoTek', 40], ['lattUtr', 30], ['aktiv', 20]],
];
const OFF = [1, 2, 3, 5, 6]; // tue, wed, thu, sat, sun (0=mon)

function tipsFor(b: Built, phase: number): string[] {
  const tips: string[] = [];
  if (phase <= 2) tips.push('Ljumsken styr. Lätt träningsvärk i musklerna är okej, smärta eller tryck i ljumsken är det inte.');
  if (phase === 2 && /^rs/.test(b.templateType)) tips.push('Platt asfalt utan trafik, hjälm och gärna långsamma hjul. Ett fall nu vore onödigt.');
  if (b.fb) tips.push(SNOWFB);
  if (b.templateType === 'rsInt') tips.push('Mörkt eller blött ute? Gör intervallerna på stakmaskin på gymmet i stället, med samma upplägg.');
  if (b.templateType === 'lopInt') tips.push('Mörkt eller halt ute? Kör samma intervaller på löpband i stället.');
  if (b.stak && phase === 2) tips.push('Stakning spänner magen hårt. Känns det minsta i ljumsken, avbryt stakdelen och cykla klart.');
  if (b.durationMin >= 120) tips.push('Öva på att äta och dricka i rörelse. På 90 km kommer det att avgöra mer än konditionen.');
  if (/Int/.test(b.templateType)) tips.push('Har du dålig sömn, förkylning eller tunga ben: gör passet lugnt i stället.');
  tips.push('Pulszonerna i klockan duger gott. Lugnt betyder att du kan prata i hela meningar.');
  return tips;
}

function build(spec: any[], date: string, phase: number): Session {
  const args = spec.slice(1);
  let strengthKey: string | null = null;
  if (typeof args[args.length - 1] === 'string' && STR[args[args.length - 1]]) {
    strengthKey = args.pop();
  }
  const b: Built = T[spec[0]](...args);
  const session: Session = {
    id: date,
    date,
    sport: b.sport,
    title: b.title,
    durationMin: b.durationMin,
    intensity: b.intensity,
    phase,
    steps: b.steps,
    purpose: b.purpose,
    strength: strengthKey ? STR[strengthKey] : null,
  };
  if (b.race) session.race = true;
  if (b.fb) session.snowFallback = true;
  if (!b.race) session.tips = tipsFor(b, phase);
  return session;
}

const sessions: Session[] = [];
sessions.push(build(['lopLugn', 45], '2026-10-04', 1));
for (const [start, phase, , ...days] of W) {
  for (let i = 0; i < OFF.length; i++) {
    const date = add(start, OFF[i]);
    sessions.push(build(days[i], date, phase));
  }
}
sessions.push(build(['lopp'], RACE, 5));
sessions.sort((a, b) => a.date.localeCompare(b.date));

const plan: Omit<PlanDocument, 'userId' | 'updatedAt'> = {
  slug: 'salen-mora-2027',
  title: 'Sälen–Mora 2027',
  goal: 'Öppet Spår måndag 90, skate',
  raceDate: RACE,
  startDate: '2026-10-04',
  phases: PH,
  restLabel: 'Vila och Tai Chi',
  emergency:
    'Varningssignaler under hela perioden: smärta i ljumsken, en ny utbuktning eller tryckkänsla. Backa då och kontakta kliniken eller 1177. Planen är en allmän vägledning och ersätter inte råd från din kirurg.',
  sessions,
};

writeFileSync(new URL('../seed/salen-mora.json', import.meta.url), JSON.stringify(plan, null, 2) + '\n');
console.log(`Wrote ${sessions.length} sessions to seed/salen-mora.json`);
