'use client';
import RevenueCalculator from '../components/RevenueCalculator';
import CreatorEarningsCalculator from '../components/CreatorEarningsCalculator';

export default function Page() {
  return (
    <div className="min-h-screen bg-zinc-50 py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto space-y-12 md:space-y-20">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">The Deadline Matrix</h1>
          <p className="max-w-xl mx-auto text-zinc-500 font-bold uppercase tracking-widest text-[10px] md:text-xs">
            Calculating the path to 100 Creators & 12,000 Revenue Minutes Daily
          </p>
        </div>

        <RevenueCalculator />

        <div className="pt-20 border-t-2 border-zinc-200 border-dashed">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">Creator Recruitment View</h2>
            <p className="max-w-xl mx-auto text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
              How it looks to a potential joiner on the landing page
            </p>
          </div>
          <CreatorEarningsCalculator />
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { label: 'Active Supply', target: '100 Creators', desc: 'Recruitment & Vetting' },
            { label: 'Avg Session', target: '15 Mins', desc: 'Retention & Quality' },
            { label: 'Daily Cap', target: '120 Mins', desc: 'Utilization Ceiling' },
          ].map((item, i) => (
            <div key={i} className="bg-white border-2 border-black p-6 hover:-translate-y-1 transition-transform">
              <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">{item.label}</p>
              <p className="text-xl font-black italic mb-1">{item.target}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
