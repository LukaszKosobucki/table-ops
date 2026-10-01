import { getMonsters } from '@/lib/monsters';
import { MainDashboard } from '@/components/MainDashboard';

export const revalidate = 0; // Dynamic rendering for fresh data

export default async function Home() {
  const initialMonsters = await getMonsters();

  return <MainDashboard initialMonsters={initialMonsters} />;
}
