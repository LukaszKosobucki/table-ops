import { MainDashboard } from '@/components/MainDashboard';
import { getMonsters } from '@/lib/monsters';

export default async function Home() {
  const initialMonsters = await getMonsters();

  return <MainDashboard initialMonsters={initialMonsters} />;
}
