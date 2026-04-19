import { QuickCapture } from '@/components/quick-capture';
import { ChatInterface } from '@/components/chat-interface';
import { MemoryFeed } from '@/components/memory-feed';
import { BrainCircuit, Target, Compass, Clock } from 'lucide-react';

// Fetch stats + recent memories server-side so the page loads with data.
// We use the mock user ID until auth is wired up.
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

async function getDashboardData() {
  try {
    // During dev, the base URL is always localhost:3000
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(
      `${baseUrl}/api/memories?user_id=${MOCK_USER_ID}`,
      { cache: 'no-store' } // Always fresh
    );
    if (!res.ok) return { memories: [], counts: { ideas: 0, tasks: 0, projects: 0 } };
    return res.json();
  } catch {
    return { memories: [], counts: { ideas: 0, tasks: 0, projects: 0 } };
  }
}

export default async function Home() {
  const { memories, counts } = await getDashboardData();

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-indigo-500/30">
      {/* Background ambient glows */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="absolute top-[-10%] w-[800px] h-[500px] bg-indigo-500/20 blur-[120px] rounded-full mix-blend-screen opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-fuchsia-500/10 blur-[120px] rounded-full mix-blend-screen opacity-50" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 flex flex-col gap-12">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white/90">Agentic Brain</h1>
          </div>

          <nav className="flex gap-4 text-sm font-medium text-neutral-400">
            <a href="#" className="hover:text-white transition-colors">Dashboard</a>
            <a href="#capture" className="hover:text-white transition-colors">Capture</a>
            <a href="#chat" className="hover:text-white transition-colors">Chat</a>
          </nav>
        </header>

        {/* Hero */}
        <section className="flex flex-col gap-4 py-6">
          <h2 className="text-5xl md:text-6xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-neutral-500">
            Your Vibe-Coding <br />
            <span className="text-indigo-400">Execution Partner.</span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl leading-relaxed">
            Dump ideas, voice notes, and tasks here. The system automatically
            tags, organises, and connects them — then helps you execute.
          </p>
        </section>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Projects"
            value={counts.projects}
            icon={<Target className="w-5 h-5 text-fuchsia-400" />}
            accent="fuchsia"
          />
          <StatCard
            label="Ideas"
            value={counts.ideas}
            icon={<Compass className="w-5 h-5 text-indigo-400" />}
            accent="indigo"
          />
          <StatCard
            label="Tasks"
            value={counts.tasks}
            icon={<Clock className="w-5 h-5 text-amber-400" />}
            accent="amber"
          />
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Capture + Memory Feed */}
          <div id="capture" className="lg:col-span-2 flex flex-col gap-6">
            {/* QuickCapture is a client component — pass a revalidation path */}
            <QuickCapture />
            <MemoryFeed initialMemories={memories} userId={MOCK_USER_ID} />
          </div>

          {/* Right: Chat */}
          <div id="chat" className="lg:col-span-3">
            <ChatInterface />
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: 'indigo' | 'fuchsia' | 'amber';
}) {
  const borderColor = {
    indigo: 'hover:border-indigo-500/30',
    fuchsia: 'hover:border-fuchsia-500/30',
    amber: 'hover:border-amber-500/30',
  }[accent];

  return (
    <div
      className={`p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md flex flex-col gap-3 transition-all duration-200 cursor-default ${borderColor} hover:bg-white/[0.04]`}
    >
      <div className="flex items-center gap-2 text-neutral-400 font-medium text-sm">
        {icon}
        {label}
      </div>
      <div className="text-4xl font-bold text-white/90 tabular-nums">{value}</div>
    </div>
  );
}
