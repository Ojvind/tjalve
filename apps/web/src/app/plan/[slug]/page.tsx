import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiPlan, apiProgress, ApiError } from '@/lib/api';
import { getToken } from '@/lib/session';
import { buildWeeks } from '@/lib/weeks';
import { dayNumber, dayShort, formatDuration, longDate, parseDate, shortDate, SPORT_LABEL, todayStr } from '@/lib/format';
import { CheckButton } from '@/components/CheckButton';
import { CourseProfile } from '@/components/CourseProfile';
import { LogoutButton } from '@/components/LogoutButton';

export default async function PlanPage({ params }: { params: { slug: string } }) {
  const token = getToken()!;

  let plan;
  try {
    plan = await apiPlan(token, params.slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const { entries } = await apiProgress(token, plan._id);
  const doneIds = new Set(entries.map((e) => e.sessionId));

  const trainable = plan.sessions.filter((s) => !s.rest);
  const doneCount = trainable.filter((s) => doneIds.has(s.id)).length;
  const today = todayStr();
  const daysLeft = plan.raceDate ? Math.max(0, Math.round((parseDate(plan.raceDate).getTime() - parseDate(today).getTime()) / 86400000)) : null;

  const km = plan.raceDate && trainable.length > 0 ? (doneCount / trainable.length) * 90 : null;

  const nextSession =
    trainable.find((s) => s.date >= today && !doneIds.has(s.id)) ?? trainable.find((s) => !doneIds.has(s.id)) ?? null;

  const weeks = buildWeeks(plan);
  const currentWeekIdx = weeks.findIndex((w) => today <= w.days[6].date);
  const defaultOpen = new Set([currentWeekIdx, currentWeekIdx + 1].filter((i) => i >= 0));

  const currentPhaseN = plan.phases?.find((p, i) => {
    const w = weeks[currentWeekIdx === -1 ? weeks.length - 1 : currentWeekIdx];
    const s = w?.days.find((d) => d.session)?.session;
    return s?.phase === p.n;
  })?.n;

  return (
    <div className="wrap">
      <header className="hero">
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <LogoutButton />
        </div>
        <h1>{plan.title}</h1>
        <p className="race">{plan.goal}</p>
        {km !== null && <CourseProfile km={km} />}
        <div className="status">
          {daysLeft !== null && (
            <span>
              <b>{daysLeft}</b> dagar kvar
            </span>
          )}
          <span>
            <b>{doneCount}</b> av {trainable.length} pass klara
          </span>
          {km !== null && (
            <span>
              Du är vid <b>{Math.round(km)} km</b>
            </span>
          )}
        </div>
      </header>

      {nextSession && (
        <Link href={`/plan/${plan.slug}/pass/${nextSession.id}`} className="next">
          <div className="t">
            <div className="k">{nextSession.date === today ? 'Dagens pass' : `Nästa pass, ${longDate(nextSession.date)}`}</div>
            <div className="h">{nextSession.title}</div>
            <div className="m">
              {formatDuration(nextSession.durationMin)}
              {nextSession.intensity ? `, ${nextSession.intensity.toLowerCase()}` : ''}
            </div>
          </div>
          <span className="chev" aria-hidden="true">
            ›
          </span>
        </Link>
      )}

      {plan.phases && plan.phases.length > 0 && (
        <>
          <h2 className="sec">Faserna</h2>
          <div className="phases">
            {plan.phases.map((p) => (
              <div className={`phase${p.n === currentPhaseN ? ' on' : ''}`} key={p.n}>
                <span className="n">{p.n}</span>
                <span className="d">
                  <b>{p.name}</b>, {p.dateRange}. {p.description}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="sec">Vecka för vecka</h2>
      {weeks.map((week, wi) => {
        const weekSessions = week.days.filter((d) => d.session && !d.session.rest).map((d) => d.session!);
        const weekDone = weekSessions.filter((s) => doneIds.has(s.id)).length;
        return (
          <details className="week" key={week.index} open={defaultOpen.has(wi)}>
            <summary>
              <span className="wk-title">Vecka {week.isoWeek}</span>
              <span className={`wk-count${weekSessions.length > 0 && weekDone === weekSessions.length ? ' full' : ''}`}>
                {weekSessions.length > 0 ? `${weekDone}/${weekSessions.length}` : ''}
              </span>
              <span className="wk-sub">
                {shortDate(week.days[0].date)}–{shortDate(week.days[6].date)}
              </span>
            </summary>
            {week.days.map((d) => {
              if (!d.session) {
                return (
                  <div className={`day rest${d.date === today ? ' today' : ''}`} key={d.date}>
                    <span className="restdot" aria-hidden="true">
                      –
                    </span>
                    <span className="dn">
                      {dayShort(d.date)}
                      <b>{dayNumber(d.date)}</b>
                    </span>
                    <span className="st">
                      <span className="tt">{plan.restLabel ?? 'Vila'}</span>
                    </span>
                  </div>
                );
              }
              const s = d.session;
              if (s.rest) {
                return (
                  <div className={`day rest${d.date === today ? ' today' : ''}`} key={d.date}>
                    <span className="restdot" aria-hidden="true">
                      –
                    </span>
                    <span className="dn">
                      {dayShort(d.date)}
                      <b>{dayNumber(d.date)}</b>
                    </span>
                    <span className="st">
                      <span className="tt">{s.title}</span>
                    </span>
                  </div>
                );
              }
              const done = doneIds.has(s.id);
              return (
                <div className={`day${done ? ' done' : ''}${d.date === today ? ' today' : ''}`} key={d.date}>
                  <CheckButton planId={plan._id} sessionId={s.id} initialDone={done} label={`${s.title} ${shortDate(s.date)}`} />
                  <span className="dn">
                    {dayShort(d.date)}
                    <b>{dayNumber(d.date)}</b>
                  </span>
                  <Link href={`/plan/${plan.slug}/pass/${s.id}`} className="st">
                    <span className="tt">{s.title}</span>
                    <br />
                    <span className="mm">
                      {s.race ? SPORT_LABEL.race : formatDuration(s.durationMin)}
                      {s.strength ? ` + ${s.strength.title.split(' – ')[0].toLowerCase()}` : ''}
                    </span>
                  </Link>
                  <Link href={`/plan/${plan.slug}/pass/${s.id}`} className="chev" aria-hidden="true" tabIndex={-1}>
                    ›
                  </Link>
                </div>
              );
            })}
          </details>
        );
      })}

      {plan.emergency && <p className="foot">{plan.emergency}</p>}
    </div>
  );
}
