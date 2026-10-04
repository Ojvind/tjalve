import { redirect } from 'next/navigation';
import { apiPlans } from '@/lib/api';
import { getToken } from '@/lib/session';

export default async function HomePage() {
  const token = getToken()!;
  const { plans } = await apiPlans(token);

  if (plans.length === 0) {
    return (
      <div className="wrap">
        <h1>Tjalve</h1>
        <p>Ingen träningsplan är inlagd ännu.</p>
      </div>
    );
  }

  if (plans.length === 1) {
    redirect(`/plan/${plans[0].slug}`);
  }

  return (
    <div className="wrap">
      <h1>Tjalve</h1>
      <ul className="plan-list">
        {plans.map((p) => (
          <li key={p.slug}>
            <a href={`/plan/${p.slug}`}>{p.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
