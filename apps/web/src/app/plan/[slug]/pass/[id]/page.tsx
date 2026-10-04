import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiPlan, apiProgress, ApiError } from '@/lib/api';
import { getToken } from '@/lib/session';
import { formatDuration, longDate, shortDate } from '@/lib/format';
import { CheckButton } from '@/components/CheckButton';

export default async function SessionPage({ params }: { params: { slug: string; id: string } }) {
  const token = getToken()!;

  let plan;
  try {
    plan = await apiPlan(token, params.slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const sessions = [...plan.sessions].sort((a, b) => a.date.localeCompare(b.date));
  const idx = sessions.findIndex((s) => s.id === params.id);
  if (idx === -1) notFound();
  const session = sessions[idx];
  const prev = sessions[idx - 1];
  const next = sessions[idx + 1];

  const { entries } = await apiProgress(token, plan._id);
  const done = entries.some((e) => e.sessionId === session.id);

  return (
    <div className="wrap">
      <Link href={`/plan/${plan.slug}`} className="back">
        ‹ Alla veckor
      </Link>
      <article className="detail">
        <div className="d-date">
          {longDate(session.date)}
          {session.phase ? `, fas ${session.phase}` : ''}
        </div>
        <h1 className="d-title">{session.title}</h1>

        <div className="facts">
          <div>
            Längd
            <b>{session.race ? 'Lopp' : formatDuration(session.durationMin)}</b>
          </div>
          {session.intensity && (
            <div>
              Intensitet
              <b>{session.intensity}</b>
            </div>
          )}
          {session.strength && (
            <div>
              Plus
              <b>{session.strength.title.split(' – ')[0]}</b>
            </div>
          )}
        </div>

        <h3>Så gör du</h3>
        <ol>
          {session.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>

        {session.purpose && (
          <>
            <h3>Syfte</h3>
            <p>{session.purpose}</p>
          </>
        )}

        {session.tips && session.tips.length > 0 && (
          <>
            <h3>Tänk på</h3>
            <ul>
              {session.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </>
        )}

        {session.strength && (
          <section className="strength">
            <h3>
              {session.strength.title} ({formatDuration(session.strength.durationMin)}), efter passet
            </h3>
            <ol>
              {session.strength.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
            {session.strength.note && <p className="warn">{session.strength.note}</p>}
          </section>
        )}

        {!session.race && !session.rest && (
          <CheckButton planId={plan._id} sessionId={session.id} initialDone={done} variant="big" label={session.title} />
        )}

        <nav className="pager">
          {prev ? (
            <Link href={`/plan/${plan.slug}/pass/${prev.id}`}>
              ‹ {shortDate(prev.date)}
              <b>{prev.title}</b>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/plan/${plan.slug}/pass/${next.id}`} className="r">
              {shortDate(next.date)} ›<b>{next.title}</b>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </div>
  );
}
