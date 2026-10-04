// Converts rehabprogram_Linus_v6.pdf (7 sep - 13 dec 2026, vecka 9-22 efter
// operationen) into the same Session[] shape used by salen-mora. The PDF has
// no generator of its own (every day is already spelled out), so this is a
// direct, auditable transcription: one literal day-table below, with the
// four recurring named sessions (Bålpass, Rörlighetspass, Styrkepass A/B/C,
// Skridskopass) built from shared exercise-table constants so they're not
// retyped 14 times. Run with:
//   npm run build:linus
import { writeFileSync } from 'node:fs';
import type { PlanDocument, Session, Sport } from '../src/models/types.js';

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

interface Built {
  sport: Sport;
  title: string;
  durationMin: number;
  intensity?: string;
  steps: string[];
  tips?: string[];
  rest?: boolean;
}

// ---------- de sex reglerna ----------
const RULES = [
  'Tempo: Lugnt tempo = du kan prata i hela meningar utan att bli andfådd. Om du inte kan det, sakta ner. Medeltempo = korta meningar. Hårt tempo = enstaka ord. Står inget tempo i schemat är det lugnt tempo.',
  'Andning: Andas ut när du anstränger dig. Håll aldrig andan i en övning. Klarar du inte övningen utan att hålla andan är vikten för tung — sänk den.',
  'Smärta: Sting, drag eller tryck vid ärret: avbryt passet direkt. Vila två dagar. Gör sedan halva mängden av det pass du avbröt. Gör resten av schemat som vanligt.',
  'Missat pass: Ett missat pass görs inte igen. Gå vidare till nästa dag i schemat. Lägg aldrig ihop två pass på en dag.',
  'Vikt: Välj en vikt du klarar alla set med och har två repetitioner kvar. Öka med 2,5 kg först när du klarat alla set med rätt teknik två pass i rad.',
  'Snö: När det finns snö: byt lördagens långpass mot ett skidpass med skate, lika många minuter. Byt inget annat pass. Rullskidor används inte.',
];

const EXCLUSIONS = [
  'Rullskidor: ingår inte i programmet. Skidteknik tränas först på snö.',
  'Stakmaskin: ingår inte. Stakning är belastad bålfällning och är den tyngsta belastningen ett medellinjessnitt kan få. Den kan tas upp tidigast i januari, och bara om kirurgen sagt ja i december.',
  'Maxlyft: ingår inte. Tidigast mitten av januari, efter läkarbedömning.',
  'Kontaktidrott och hockey: ingår inte. Tidigast mitten av januari, efter läkarbedömning.',
  'Situps, crunches och hängande benlyft: ingår inte alls under programmet.',
];

const EMERGENCY =
  'Ring vården samma dag vid: bula eller buktning vid ärret · plötslig kraftig magsmärta · kräkning tillsammans med uppblåst mage · ingen avföring på två dygn tillsammans med magsmärta · feber över 38 grader · rodnad eller vätska från ärret. Vårdcentral på dagtid, 1177 annars, 112 vid kraftig smärta.';

const WEEKLY_CHECKS = [
  'Ärrkontroll — varje söndag. Ställ dig upp framför en spegel. Spänn magen och hosta en gång. Titta och känn längs hela snittet, uppifrån och ner. Du letar efter en bula eller buktning som inte fanns förra söndagen. Hittar du en: träna inte, ring vårdcentralen eller 1177 nästa vardag.',
];

// ---------- återkommande pass ----------
function bal(): Built {
  return {
    sport: 'strength',
    title: 'Bålpass',
    durationMin: 15,
    steps: [
      'Diafragmaandning, liggande på rygg, hand på magen — 10 andetag.',
      'Dead bug — 3 × 8 per sida, vila 45 sek.',
      'Bird dog — 3 × 8 per sida, vila 45 sek.',
      'Höftlyft — 3 × 12, vila 45 sek.',
      'Sidoplanka på knä — 3 × 20 sek per sida, vila 45 sek.',
      'Tempo: 5 sekunder per repetition. Andas ut i den ansträngande delen.',
    ],
  };
}

function rorlighet(): Built {
  return {
    sport: 'mobility',
    title: 'Rörlighetspass',
    durationMin: 15,
    steps: [
      'Katt–kamel — 10 varv.',
      'Höftlyft — 10 st.',
      'Knästående höftböjarstretch — 1,5 min per sida.',
      '90/90-sittande, luta framåt — 1,5 min per sida.',
      'Open book, sidliggande — 10 per sida.',
      'Knästående rotation — 10 per sida.',
      'Thread the needle — 8 per sida.',
      'Rotationerna ska kännas i ryggen, aldrig i magen eller vid ärret.',
    ],
  };
}

function balRorlighet(): Built {
  return {
    sport: 'strength',
    title: 'Bålpass + rörlighetspass',
    durationMin: 30,
    steps: ['Bålpass (15 min):', ...bal().steps.slice(0, -1), 'Rörlighetspass (15 min):', ...rorlighet().steps],
  };
}

const STYRKA_NOTE: Record<'A' | 'B' | 'C', string> = {
  A: 'Ingen skivstång i detta pass. Inga vikter över 10 kg.',
  B: 'Följ regel 5 för vikt. Inga maxlyft. Avbryt setet om du behöver hålla andan.',
  C: 'Maxlyft är fortfarande inte tillåtet. Högsta vikt: 80 % av det du klarade före operationen.',
};

const STYRKA_ITEMS: Record<'A' | 'B' | 'C', { exercise: string; sets: number; reps: string; vila: string }[]> = {
  A: [
    { exercise: 'Knäböj, kroppsvikt', sets: 3, reps: '10', vila: '60 sek' },
    { exercise: 'Split squat, kroppsvikt', sets: 3, reps: '8 per ben', vila: '60 sek' },
    { exercise: 'Höftlyft', sets: 3, reps: '12', vila: '60 sek' },
    { exercise: 'Sidoutfall, kroppsvikt', sets: 3, reps: '8 per ben', vila: '60 sek' },
    { exercise: 'Höftabduktion, sidliggande', sets: 3, reps: '12 per sida', vila: '60 sek' },
    { exercise: "Farmer's carry, 10 kg per hand", sets: 2, reps: '20 meter', vila: '60 sek' },
  ],
  B: [
    { exercise: 'Knäböj med skivstång', sets: 3, reps: '8', vila: '90 sek' },
    { exercise: 'Rumänsk marklyft med skivstång', sets: 3, reps: '8', vila: '90 sek' },
    { exercise: 'Bulgarisk split squat, hantlar', sets: 3, reps: '8 per ben', vila: '90 sek' },
    { exercise: 'Höftabduktion med gummiband, stående', sets: 3, reps: '15 per sida', vila: '60 sek' },
    { exercise: "Farmer's carry, 20 kg per hand", sets: 3, reps: '20 meter', vila: '90 sek' },
  ],
  C: [
    { exercise: 'Knäböj med skivstång', sets: 4, reps: '6', vila: '2 min' },
    { exercise: 'Rumänsk marklyft med skivstång', sets: 3, reps: '8', vila: '2 min' },
    { exercise: 'Enbensknäböj ner till pall', sets: 3, reps: '6 per ben', vila: '90 sek' },
    { exercise: 'Sidohopp, landa mjukt på ett ben', sets: 4, reps: '6 per sida', vila: '90 sek' },
    { exercise: "Farmer's carry, 24 kg per hand", sets: 3, reps: '30 meter', vila: '90 sek' },
  ],
};

const STYRKA_FULL_MIN: Record<'A' | 'B' | 'C', number> = { A: 30, B: 40, C: 45 };
const STYRKA_LIGHT_MIN: Record<'A' | 'B' | 'C', number> = { A: 20, B: 25, C: 30 };

function styrka(level: 'A' | 'B' | 'C', light: boolean): Built {
  const items = STYRKA_ITEMS[level].map((it) => {
    const sets = light ? Math.min(it.sets, 2) : it.sets;
    return `${it.exercise} — ${sets} × ${it.reps}, vila ${it.vila}.`;
  });
  return {
    sport: 'strength',
    title: `Styrkepass ${level}${light ? ', 2 set av varje övning' : ''}`,
    durationMin: light ? STYRKA_LIGHT_MIN[level] : STYRKA_FULL_MIN[level],
    steps: [...items, STYRKA_NOTE[level]],
  };
}

function skridsko(minutes: number, extra?: string): Built {
  return {
    sport: 'ice-skate',
    title: 'Skridskopass',
    durationMin: minutes,
    steps: [`Åkning på is i lugnt tempo, långa skär, hela passet.`, ...(extra ? [extra] : [])],
    tips: ['Inga tvära stopp. Ingen sprint. Ingen kontakt. Ingen puck. Åk ensam eller med någon som vet att det gäller.'],
  };
}

function lopning(minutes: number, steps: string[]): Built {
  return { sport: 'running', title: 'Löpning', durationMin: minutes, steps };
}

function langpass(minutes: number, steps: string[]): Built {
  return { sport: 'running', title: 'Långpass löpning', durationMin: minutes, steps };
}

function backpass(minutes: number, reps: string, workSec: number): Built {
  return {
    sport: 'running',
    title: 'Backpass',
    durationMin: minutes,
    steps: [
      '10 min uppvärmning i lugnt tempo.',
      `${reps} uppför i medeltempo, ${workSec} sek per intervall, gå tillbaka ner på 2 min mellan varje.`,
      '10 min lugn nedvarvning.',
    ],
  };
}

function promenad(minutes: number, steps: string[]): Built {
  return { sport: 'walk', title: 'Promenad', durationMin: minutes, steps };
}

function rest(extra: string): Built {
  return { sport: 'rest', title: 'Vila', durationMin: 0, rest: true, steps: ['Ingen träning.', extra] };
}

function scarCheck(extra?: string): Built {
  return {
    sport: 'rest',
    title: 'Vila — ärrkontroll',
    durationMin: 0,
    rest: true,
    steps: [
      'Ingen träning.',
      'Gör ärrkontrollen: stå framför en spegel, spänn magen och hosta en gång, känn längs hela ärret uppifrån och ner. Leta efter en bula eller buktning som inte fanns förra söndagen.',
      ...(extra ? [extra] : []),
    ],
  };
}

const fmt = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}`);

const WALK_ALLOWED = 'Promenad upp till 30 minuter är tillåtet.';

// ---------- 14 dec 2026 – 1 mar 2027: mot loppet ----------
// Linus v6 slutar 13 dec med klartecken att trappa upp igen. Från 14 dec
// kör han i grunden samma block som Öjvind (se generate-salen-mora.ts,
// samma veckor från '2026-12-14'), med två skillnader som är Linus-specifika:
// (1) han har inga rullskidor och ska inte köra dem - nämns aldrig som
// alternativ här, och (2) vardagarnas landpass nämner trappmaskin explicit
// som ett tredje alternativ till löpning/cykel, vilket Öjvinds version inte
// behöver. Skidpassen (helger, riktig snö) är annars identiska i innehåll.
const LINUS_SNOWFB = 'Ingen snö där du är? Kör passet som löpning eller cykling i stället.';

const SKI_STR: Record<'A' | 'B' | 'C', { title: string; durationMin: number; items: string[]; note?: string }> = {
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
    note: 'Håll inte andan och krysta inte. Det ska kännas i musklerna, aldrig i ljumsken eller vid ärret.',
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

interface Built2 extends Built {
  templateType: string;
  fb?: boolean;
}

function cykling(minutes: number): Built2 {
  return {
    sport: 'cycling',
    title: 'Cykling',
    durationMin: minutes,
    steps: ['Cykla lugnt de första 10 minuterna.', `Håll jämn, lugn ansträngning resten av passet, totalt ${fmt(minutes)}.`],
    templateType: 'cykling',
  };
}

function lopningEasy(minutes: number): Built2 {
  return { ...lopning(minutes, [`Spring ${fmt(minutes)} i lugnt tempo.`]), templateType: 'lopning' };
}

function crosstrainerEasy(minutes: number): Built2 {
  return {
    sport: 'crosstrainer',
    title: 'Crosstrainer',
    durationMin: minutes,
    intensity: 'Lugnt, zon 2',
    steps: [
      'Kör lugnt de första 10 minuterna.',
      `Håll jämn, lugn ansträngning resten av passet, totalt ${fmt(minutes)}.`,
      'Variera gärna motstånd eller lutning med jämna mellanrum.',
    ],
    templateType: 'crosstrainer',
  };
}

function cykelIntL(minutes: number, set: string, restTime: string, hard: boolean): Built2 {
  return {
    sport: 'cycling',
    title: `Cykelintervaller ${set}`,
    durationMin: minutes,
    intensity: hard ? 'Hårt' : 'Tröskel',
    steps: [
      '15–20 min lugn uppvärmning med 3–4 korta stegringar.',
      `${set} i hårt tempo (högt motstånd eller motlut), med ${restTime} lugn trampning emellan. Jämn effekt: sista intervallen ska kännas lika hård som första.`,
      `Lugn nedvarvning tills passet är totalt cirka ${fmt(minutes)}.`,
    ],
    templateType: 'cykelInt',
  };
}

function crossIntL(minutes: number, set: string, restTime: string, hard: boolean): Built2 {
  return {
    sport: 'crosstrainer',
    title: `Crosstrainer – intervaller ${set}`,
    durationMin: minutes,
    intensity: hard ? 'Hårt' : 'Tröskel',
    steps: [
      '15–20 min lugn uppvärmning med stigande motstånd.',
      `${set} i hårt tempo med högt motstånd, med ${restTime} lugnt emellan. Jämn fart: sista intervallen ska gå lika hårt som första.`,
      `Lugn nedvarvning tills passet är totalt cirka ${fmt(minutes)}.`,
    ],
    templateType: 'crossInt',
  };
}

function snoLugnL(minutes: number): Built2 {
  return {
    sport: 'skate-ski',
    title: 'Skejt – lugn distans',
    durationMin: minutes,
    intensity: 'Lugnt, zon 2',
    steps: [
      '10 min lugn uppvärmning.',
      `${fmt(minutes - 15)} jämn, lugn åkning. Välj teknik efter terrängen: dubbeldans på flackt, paddling i backar.`,
      '5 min lugnt avslut och stretch av höftböjare och vader.',
    ],
    fb: true,
    templateType: 'snoLugn',
  };
}

function snoTekL(minutes: number): Built2 {
  return {
    sport: 'skate-ski',
    title: 'Skejt – teknik och balans',
    durationMin: minutes,
    intensity: 'Lugnt',
    steps: [
      '10 min lugn åkning i dubbeldans.',
      'Balans: 4 × 1 min utan stavar, gärna i ett lätt utför.',
      'Paddling i motlut: 4 × 1 min. Fokus på höga höfter och ett lugnt, långt frånskjut.',
      '6 × 30 sek i loppfart på flackt med 1 min lugnt emellan.',
      `Lugn distans resten av tiden, totalt ${fmt(minutes)}.`,
    ],
    fb: true,
    templateType: 'snoTek',
  };
}

function snoLangL(minutes: number): Built2 {
  return {
    sport: 'skate-ski',
    title: 'Långpass skejt',
    durationMin: minutes,
    intensity: 'Lugnt, zon 1–2',
    steps: [
      'Starta lugnt, de första 20 minuterna ska kännas nästan för lätta.',
      `Åk ${fmt(minutes)} i jämn, lugn fart. Lägg slingan så att du passerar bilen eller ett fik för påfyllning.`,
      'Ät och drick var 30–45 min. Använd samma typ av energi som du tänker ha i loppet.',
    ],
    fb: true,
    templateType: 'snoLang',
  };
}

function snoIntL(minutes: number, set: string, restTime: string, hard: boolean): Built2 {
  return {
    sport: 'skate-ski',
    title: `Skejt – intervaller ${set}`,
    durationMin: minutes,
    intensity: hard ? 'Hårt, zon 4–5' : 'Tröskel, zon 4',
    steps: [
      '15–20 min lugn uppvärmning med 3–4 korta stegringar.',
      `${set} i lätt motlut, med ${restTime} lugn åkning emellan. Jämn fart: sista intervallen ska gå lika fort som första.`,
      `Lugn nedvarvning tills passet är totalt cirka ${fmt(minutes)}.`,
    ],
    fb: true,
    templateType: 'snoInt',
  };
}

function genrepL(minutes: number): Built2 {
  return {
    sport: 'skate-ski',
    title: 'Genrep – 5 timmar',
    durationMin: minutes,
    intensity: 'Lugnt till loppfart',
    steps: [
      'Åk 5 timmar, gärna ungefär 60 km, i den fart du tänker hålla i Öppet Spår.',
      'Använd exakt de skidor, den valla, de kläder och den mat du ska ha i loppet.',
      'Ät och drick var 30–45 min, som om varje halvtimme vore en kontroll.',
      'Notera hur långt du kommer per timme. Det blir din grund för loppets tidsplan och reptiderna.',
    ],
    fb: true,
    templateType: 'genrep',
  };
}

function lattUtrL(minutes: number): Built2 {
  return {
    sport: 'skate-ski',
    title: 'Lätt åkning och utrustningskoll',
    durationMin: minutes,
    intensity: 'Lugnt',
    steps: ['30 min lugn åkning, gärna på loppskidorna.', 'Testa glid och kläder i den temperatur som är utlovad.', 'Packa allt du ska ha och lägg fram det.'],
    templateType: 'lattUtr',
  };
}

function aktivL(minutes: number): Built2 {
  return {
    sport: 'skate-ski',
    title: 'Aktivering',
    durationMin: minutes,
    intensity: 'Lugnt + några korta ryck',
    steps: ['15 min mycket lugn åkning eller jogg.', '3 × 30 sek i loppfart med 1 min lugnt emellan.', 'Kolla skidor, valla, nummerlapp, kläder och mat för morgondagen.'],
    templateType: 'aktiv',
  };
}

function loppL(): Built2 {
  return {
    sport: 'race',
    title: 'Öppet Spår måndag 90',
    durationMin: 0,
    intensity: 'Din dag',
    rest: false,
    steps: [
      'Start i Berga by, Sälen. Startfållorna öppnar 06.00 och startleden går var tionde minut från 07.00. Ditt led avgör din starttid.',
      'Börja lugnare än du tror. Den första backen är lång och det är 90 km kvar.',
      'Ät och drick vid varje kontroll, även när du inte känner dig hungrig.',
      'Reptider (sista passering): Smågan 10.30, Mångsbodarna 12.15, Risberg 13.45, Evertsberg 15.00, Oxberg 16.30, Hökberg 17.40, Eldris 19.00.',
      'Boka Vasaloppsbussen när bokningen öppnar i slutet av november.',
      'Njut av sista biten in mot Mora och kyrktornet.',
    ],
    templateType: 'lopp',
  };
}

function tipsForWinter(b: Built2): string[] {
  const tips: string[] = [];
  if (b.fb) tips.push(LINUS_SNOWFB);
  if (b.durationMin >= 120) tips.push('Öva på att äta och dricka i rörelse. På 90 km kommer det att avgöra mer än konditionen.');
  if (/Int|intervall/i.test(b.templateType)) tips.push('Har du dålig sömn, förkylning eller tunga ben: gör passet lugnt i stället.');
  tips.push('Pulszonerna i klockan duger gott. Lugnt betyder att du kan prata i hela meningar.');
  return tips;
}

type WinterSpec = [Built2, string | null]; // [session, strength key or null]

interface WinterWeekRow {
  monday: string;
  phase: number;
  days: [WinterSpec, WinterSpec, WinterSpec, WinterSpec, WinterSpec]; // tue, wed, thu, sat, sun
}

const WINTER_OFF = [1, 2, 3, 5, 6]; // tue, wed, thu, sat, sun (0 = mon)

// Samma veckor och volymer som Öjvinds plan från 14 dec, bara flyttade till
// land-säkra pass för Linus där Öjvinds version hade antingen rullskidor
// (som Linus inte ska köra) eller en vardag.
const WINTER_WEEKS: WinterWeekRow[] = [
  { monday: '2026-12-14', phase: 5, days: [[cykelIntL(70, '5 × 5 min', '2 min', true), null], [cykling(60), 'C'], [crosstrainerEasy(60), null], [snoLangL(150), null], [snoLugnL(75), null]] },
  { monday: '2026-12-21', phase: 5, days: [[crossIntL(75, '3 × 10 min', '3 min', false), null], [crosstrainerEasy(60), 'C'], [cykling(75), null], [snoLangL(165), null], [snoLugnL(75), null]] },
  { monday: '2026-12-28', phase: 5, days: [[cykelIntL(80, '4 × 8 min', '2 min', false), null], [cykling(60), 'C'], [crosstrainerEasy(90), null], [snoLangL(180), null], [snoLugnL(75), null]] },
  { monday: '2027-01-04', phase: 5, days: [[crossIntL(60, '6 × 3 min', '2 min', true), null], [crosstrainerEasy(45), 'C'], [cykling(45), null], [snoLangL(120), null], [snoTekL(60), null]] },
  { monday: '2027-01-11', phase: 5, days: [[cykelIntL(85, '3 × 12 min', '3 min', false), null], [cykling(60), 'C'], [crosstrainerEasy(90), null], [snoLangL(195), null], [snoLugnL(75), null]] },
  { monday: '2027-01-18', phase: 5, days: [[crossIntL(80, '5 × 6 min', '2 min', true), null], [crosstrainerEasy(60), 'C'], [cykling(75), null], [snoLangL(210), null], [snoLugnL(80), null]] },
  { monday: '2027-01-25', phase: 5, days: [[cykelIntL(90, '2 × 20 min', '4 min', false), null], [cykling(60), 'C'], [crosstrainerEasy(90), null], [snoLangL(240), null], [snoLugnL(75), null]] },
  { monday: '2027-02-01', phase: 5, days: [[crossIntL(60, '6 × 3 min', '2 min', true), null], [crosstrainerEasy(45), 'C'], [cykling(45), null], [snoLangL(150), null], [snoTekL(60), null]] },
  { monday: '2027-02-08', phase: 6, days: [[cykelIntL(85, '3 × 15 min i loppfart', '3 min', false), null], [cykling(60), 'C'], [crosstrainerEasy(75), null], [genrepL(300), null], [snoLugnL(60), null]] },
  { monday: '2027-02-15', phase: 6, days: [[crossIntL(70, '4 × 5 min', '2 min', true), null], [crosstrainerEasy(50), null], [cykling(60), null], [snoLangL(150), null], [snoLugnL(60), null]] },
  { monday: '2027-02-22', phase: 6, days: [[snoIntL(50, '4 × 3 min i loppfart', '2 min', false), null], [cykling(40), null], [snoTekL(40), null], [lattUtrL(30), null], [aktivL(20), null]] },
];

const RACE_DATE = '2027-03-01';

interface WeekRow {
  monday: string;
  phase: number;
  days: [Built, Built, Built, Built, Built, Built, Built]; // mon..sun
}

const WEEKS: WeekRow[] = [
  {
    monday: '2026-09-07',
    phase: 1,
    days: [
      bal(),
      lopning(20, ['Spring 20 min utan gångpauser.', 'Lugnt tempo.', 'Plant underlag, ingen backe.']),
      rorlighet(),
      rest(WALK_ALLOWED),
      lopning(22, ['Spring 22 min i lugnt tempo.', 'Plant underlag.']),
      promenad(45, ['Promenad 45 min i rask takt.']),
      scarCheck(),
    ],
  },
  {
    monday: '2026-09-14',
    phase: 1,
    days: [
      styrka('A', false),
      lopning(25, ['Spring 25 min i lugnt tempo.']),
      balRorlighet(),
      rest(WALK_ALLOWED),
      lopning(25, ['Spring 25 min i lugnt tempo.']),
      langpass(40, ['Spring 40 min.', 'Lugnt tempo hela vägen.']),
      scarCheck(),
    ],
  },
  {
    monday: '2026-09-21',
    phase: 2,
    days: [
      styrka('A', false),
      lopning(30, ['Spring 30 min i lugnt tempo.']),
      balRorlighet(),
      rest(WALK_ALLOWED),
      lopning(25, ['Spring 25 min i lugnt tempo.', 'Välj en kuperad runda.']),
      langpass(50, ['Spring 50 min.', 'Lugnt tempo.']),
      scarCheck(),
    ],
  },
  {
    monday: '2026-09-28',
    phase: 2,
    days: [
      styrka('A', false),
      lopning(30, ['Spring 30 min i lugnt tempo.']),
      balRorlighet(),
      rest(WALK_ALLOWED),
      backpass(30, '4 × 30 sek', 30),
      langpass(60, ['Spring 60 min.', 'Lugnt tempo.']),
      scarCheck(),
    ],
  },
  {
    monday: '2026-10-05',
    phase: 2,
    days: [
      styrka('A', false),
      lopning(35, ['Spring 35 min i lugnt tempo.']),
      balRorlighet(),
      rest(WALK_ALLOWED),
      backpass(35, '6 × 45 sek', 45),
      langpass(70, ['Spring 70 min.', 'Lugnt tempo.']),
      scarCheck(),
    ],
  },
  {
    monday: '2026-10-12',
    phase: 2,
    days: [
      styrka('A', true),
      lopning(25, ['Spring 25 min i lugnt tempo.']),
      rorlighet(),
      rest(WALK_ALLOWED),
      lopning(25, ['Spring 25 min i lugnt tempo.', 'Inga backar.']),
      langpass(45, ['Spring 45 min.', 'Lugnt tempo.']),
      scarCheck(),
    ],
  },
  {
    monday: '2026-10-19',
    phase: 3,
    days: [
      { ...styrka('B', false), steps: ['Börja med tom stång i knäböj och marklyft.', ...styrka('B', false).steps] },
      skridsko(30),
      balRorlighet(),
      rest(WALK_ALLOWED),
      lopning(35, ['Spring 35 min i lugnt tempo.']),
      langpass(70, ['Spring 70 min.', 'Lugnt tempo.']),
      scarCheck('Extra noga efter första skivstångsveckan.'),
    ],
  },
  {
    monday: '2026-10-26',
    phase: 3,
    days: [
      styrka('B', false),
      skridsko(40),
      balRorlighet(),
      lopning(30, ['Spring 30 min i lugnt tempo.']),
      backpass(35, '6 × 45 sek', 45),
      langpass(80, ['Spring 80 min.', 'Lugnt tempo.']),
      scarCheck(),
    ],
  },
  {
    monday: '2026-11-02',
    phase: 3,
    days: [
      styrka('B', false),
      skridsko(45, 'Lägg in 6 × 1 min i medeltempo.'),
      balRorlighet(),
      rest(WALK_ALLOWED),
      lopning(35, ['10 min lugnt tempo.', '15 min medeltempo.', '10 min lugnt tempo.']),
      langpass(90, ['Spring 90 min.', 'Lugnt tempo.']),
      scarCheck(),
    ],
  },
  {
    monday: '2026-11-09',
    phase: 3,
    days: [
      styrka('B', true),
      skridsko(30),
      rorlighet(),
      rest(WALK_ALLOWED),
      lopning(30, ['Spring 30 min i lugnt tempo.']),
      langpass(60, ['Spring 60 min.', 'Lugnt tempo.']),
      scarCheck(),
    ],
  },
  {
    monday: '2026-11-16',
    phase: 4,
    days: [
      styrka('C', false),
      skridsko(45),
      balRorlighet(),
      rest(WALK_ALLOWED),
      lopning(40, ['Spring 40 min i lugnt tempo.']),
      langpass(100, ['Spring 100 min.', 'Lugnt tempo.', 'Ta med dryck.']),
      scarCheck(),
    ],
  },
  {
    monday: '2026-11-23',
    phase: 4,
    days: [
      styrka('C', false),
      skridsko(50),
      balRorlighet(),
      lopning(30, ['Spring 30 min i lugnt tempo.']),
      backpass(40, '8 × 45 sek', 45),
      langpass(110, ['Spring 110 min.', 'Lugnt tempo.', 'Ta med dryck.']),
      scarCheck(),
    ],
  },
  {
    monday: '2026-11-30',
    phase: 4,
    days: [
      styrka('C', false),
      skridsko(50),
      balRorlighet(),
      rest(WALK_ALLOWED),
      lopning(40, ['10 min lugnt tempo.', '20 min medeltempo.', '10 min lugnt tempo.']),
      langpass(120, ['Spring 120 min.', 'Lugnt tempo.', 'Ta med dryck och något att äta.']),
      scarCheck(),
    ],
  },
  {
    monday: '2026-12-07',
    phase: 4,
    days: [
      styrka('C', true),
      skridsko(40),
      rorlighet(),
      rest(WALK_ALLOWED),
      lopning(30, ['Spring 30 min i lugnt tempo.']),
      langpass(90, ['Spring 90 min.', 'Lugnt tempo.']),
      scarCheck('Boka tid hos kirurgen inför vinterblocket.'),
    ],
  },
];

const sessions: Session[] = [];
for (const week of WEEKS) {
  week.days.forEach((built, i) => {
    const date = add(week.monday, i);
    const session: Session = {
      id: date,
      date,
      sport: built.sport,
      title: built.title,
      durationMin: built.durationMin,
      phase: week.phase,
      steps: built.steps,
    };
    if (built.tips) session.tips = built.tips;
    if (built.rest) session.rest = true;
    sessions.push(session);
  });
}
// ---------- 14 dec – 1 mar: bygg sessions från WINTER_WEEKS + loppdagen ----------
for (const week of WINTER_WEEKS) {
  week.days.forEach(([built, strengthKey], i) => {
    const date = add(week.monday, WINTER_OFF[i]);
    const session: Session = {
      id: date,
      date,
      sport: built.sport,
      title: built.title,
      durationMin: built.durationMin,
      intensity: built.intensity,
      phase: week.phase,
      steps: built.steps,
      strength: strengthKey ? SKI_STR[strengthKey as 'A' | 'B' | 'C'] : null,
    };
    const tips = tipsForWinter(built);
    if (tips.length) session.tips = tips;
    if (built.fb) session.snowFallback = true;
    sessions.push(session);
  });
}
const race = loppL();
sessions.push({
  id: RACE_DATE,
  date: RACE_DATE,
  sport: race.sport,
  title: race.title,
  durationMin: race.durationMin,
  intensity: race.intensity,
  race: true,
  phase: 6,
  steps: race.steps,
  strength: null,
});

sessions.sort((a, b) => a.date.localeCompare(b.date));

const plan: Omit<PlanDocument, 'userId' | 'updatedAt'> = {
  slug: 'salen-mora-2027-linus',
  title: 'Sälen–Mora 2027 – Linus',
  goal: 'Öppet Spår måndag 90, skate',
  raceDate: RACE_DATE,
  startDate: '2026-09-07',
  phases: [
    { n: 1, name: 'Grundfas', dateRange: '7–20 sep', description: 'Löpningen blir sammanhängande. Styrka med kroppsvikt. Ingen skivstång, ingen is.' },
    { n: 2, name: 'Volymbygge', dateRange: '21 sep–18 okt', description: 'Löpvolymen byggs mot 70 minuter. Styrkepass A tre veckor i rad, sedan lättvecka.' },
    { n: 3, name: 'Skivstång och is', dateRange: '19 okt–15 nov', description: 'Skivstången kommer in. Skridsko på is ersätter ett löppass i veckan.' },
    { n: 4, name: 'Tyngre styrka', dateRange: '16 nov–13 dec', description: 'Tyngre styrka och sidohopp. Långpasset byggs mot två timmar. 13 december: avstämning med kirurgen inför nästa block.' },
    { n: 5, name: 'Snö och volym', dateRange: '14 dec–7 feb', description: 'Samma block som Öjvind kör. Skidor (skate, aldrig rullskidor) på helger när det finns snö, långpassen växer mot 4 timmar.' },
    { n: 6, name: 'Loppspecifikt och nedtrappning', dateRange: '8 feb–1 mar', description: 'Genrep, sedan mindre volym och kvar med fart.' },
  ],
  rules: RULES,
  weeklyChecks: WEEKLY_CHECKS,
  exclusions: EXCLUSIONS,
  emergency: EMERGENCY,
  sessions,
};

writeFileSync(new URL('../seed/salen-mora-linus.json', import.meta.url), JSON.stringify(plan, null, 2) + '\n');
console.log(`Wrote ${sessions.length} sessions to seed/salen-mora-linus.json`);
