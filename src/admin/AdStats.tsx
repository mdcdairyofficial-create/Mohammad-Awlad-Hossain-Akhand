import React, { useState, useEffect } from 'react';
import { Eye, Calendar, TrendingUp } from 'lucide-react';

interface AdStat {
  id: string;
  userId: string;
  date: string;
  week: string;
  month: string;
  totalViews: number;
  networks: Record<string, number>;
  lastViewedAt: any;
}

export default function AdStats() {
  const [stats, setStats] = useState<AdStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ads/stats');
      if (!response.ok) throw new Error('Failed to fetch ad stats');
      const data = await response.json();
      setStats(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group and aggregate stats based on filter
  const aggregatedStats = stats.reduce((acc: any, stat) => {
    const key = filter === 'daily' ? stat.date : filter === 'weekly' ? stat.week : stat.month;
    if (!acc[key]) {
      acc[key] = {
        key,
        totalViews: 0,
        uniqueUsers: new Set(),
        networks: {}
      };
    }
    acc[key].totalViews += stat.totalViews || 0;
    acc[key].uniqueUsers.add(stat.userId);
    
    Object.entries(stat.networks || {}).forEach(([network, views]) => {
      acc[key].networks[network] = (acc[key].networks[network] || 0) + (views as number);
    });
    
    return acc;
  }, {});

  const displayStats = Object.values(aggregatedStats).sort((a: any, b: any) => b.key.localeCompare(a.key));

  if (loading) return <div className="p-4 text-center">Loading ad stats...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Eye className="text-indigo-600" />
            Ad Views Statistics
          </h2>
          <p className="text-slate-500 text-sm mt-1">Track user ad engagement across platforms</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setFilter('daily')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'daily' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
          >
            Daily
          </button>
          <button
            onClick={() => setFilter('weekly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'weekly' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
          >
            Weekly
          </button>
          <button
            onClick={() => setFilter('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'monthly' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-3 font-semibold text-slate-600 text-sm">Time Period</th>
              <th className="p-3 font-semibold text-slate-600 text-sm">Total Views</th>
              <th className="p-3 font-semibold text-slate-600 text-sm">Unique Viewers</th>
              <th className="p-3 font-semibold text-slate-600 text-sm">By Network</th>
            </tr>
          </thead>
          <tbody>
            {displayStats.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-500">
                  No ad view data available yet.
                </td>
              </tr>
            ) : (
              displayStats.map((stat: any) => (
                <tr key={stat.key} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-800 flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    {stat.key}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 font-bold text-indigo-600">
                      <TrendingUp size={16} />
                      {stat.totalViews}
                    </div>
                  </td>
                  <td className="p-3 text-slate-600">{stat.uniqueUsers.size} users</td>
                  <td className="p-3">
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(stat.networks).map(([network, views]) => (
                        <span key={network} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md font-medium border border-slate-200">
                          {network}: {views as number}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
