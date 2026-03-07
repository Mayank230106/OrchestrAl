import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { getHistory } from '../lib/api';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  ChevronRight,
  Activity,
  Loader2,
  Inbox,
  AlertCircle,
} from 'lucide-react';

// Maps session status values from the backend to display labels + colours
const STATUS_META = {
  COMPLETED: { label: 'Completed', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  FAILED: { label: 'Failed', icon: XCircle, cls: 'bg-red-50 text-red-700 border border-red-200' },
  ACTIVE: { label: 'Active', icon: Activity, cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  PAUSED_FOR_HITL: { label: 'Awaiting Approval', icon: Clock, cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
};

// Colour for agent avatar bubbles based on session_id suffix to spread colours
const AGENT_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-emerald-500'];
const AGENT_INITIALS = ['P', 'R', 'E', 'R'];

// Rough duration from created_at to updated_at
const calcDuration = (created, updated) => {
  try {
    const ms = new Date(updated) - new Date(created);
    if (ms < 0 || isNaN(ms)) return '—';
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  } catch { return '—'; }
};

const formatDate = (isoStr) => {
  try {
    return new Date(isoStr).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return isoStr || '—'; }
};

const History = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getHistory()
      .then((data) => { setTasks(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const filtered = tasks.filter((t) =>
    (t.original_prompt || t.session_id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-end justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Task History</h1>
                <p className="text-gray-500">Review past orchestrations and their outcomes.</p>
              </div>

              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors w-64 text-sm"
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-24 text-gray-400">
                  <Loader2 size={24} className="animate-spin" />
                  <span>Loading history…</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-red-400">
                  <AlertCircle size={32} />
                  <p className="font-medium">Failed to load history</p>
                  <p className="text-sm text-gray-400">{error}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-400">
                  <Inbox size={40} />
                  <p className="font-medium">No tasks found</p>
                  <p className="text-sm">Run your first orchestration from the Dashboard.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Task</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Agents</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((task) => {
                      const meta = STATUS_META[task.status] || {
                        label: task.status,
                        icon: Activity,
                        cls: 'bg-gray-100 text-gray-600 border border-gray-200',
                      };
                      const StatusIcon = meta.icon;
                      // Show all 4 agent avatars for completed tasks, fewer for others
                      const agentCount = task.status === 'COMPLETED' ? 4 : task.status === 'FAILED' ? 2 : 3;

                      return (
                        <tr key={task.id || task.session_id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                          <td className="px-6 py-5">
                            <p className="font-bold text-slate-900 truncate max-w-xs" title={task.original_prompt}>
                              {task.original_prompt || task.session_id}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 font-mono">{task.session_id}</p>
                          </td>

                          <td className="px-6 py-5">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${meta.cls}`}>
                              <StatusIcon size={14} />
                              {meta.label}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center">
                              {AGENT_INITIALS.slice(0, agentCount).map((initial, i) => (
                                <div
                                  key={i}
                                  className={`w-7 h-7 rounded-full ${AGENT_COLORS[i]} text-white flex items-center justify-center text-xs font-bold border-2 border-white ${i !== 0 ? '-ml-2' : ''} shadow-sm`}
                                >
                                  {initial}
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                              <Calendar size={16} className="text-gray-400" />
                              {formatDate(task.created_at)}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                              <Clock size={16} className="text-gray-400" />
                              {calcDuration(task.created_at, task.updated_at)}
                            </div>
                          </td>

                          <td className="px-6 py-5 text-right">
                            <ChevronRight size={20} className="text-gray-300 group-hover:text-black transition-colors" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default History;