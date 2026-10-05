import { getMonsters } from '@/lib/monsters';
import { MainDashboard } from '@/components/MainDashboard';

export default async function Home() {
  const initialMonsters = await getMonsters();

  return <MainDashboard initialMonsters={initialMonsters} />;
}
