import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { 
  TerminalSquare, 
  Search, 
  Filter, 
  Download, 
  Play, 
  Pause, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  AlertTriangle
} from 'lucide-react';

const Logs = () => {
  // State for the mock live-stream toggle
  const [isLive, setIsLive] = useState(true);
  
  // State for filtering
  const [activeTab, setActiveTab] = useState('All');

  // Realistic mock data representing Microsoft AutoGen agent interactions
  const mockLogs = [
    {
      id: 1,
      timestamp: '2024-03-07 10:15:02.104',
      level: 'INFO',
      agent: 'System',
      message: 'Incoming workflow request: "Set up project kickoff for next Tuesday"',
    },
    {
      id: 2,
      timestamp: '2024-03-07 10:15:02.450',
      level: 'INFO',
      agent: 'Planner',
      message: 'Decomposing request into 3 subtasks. Initializing GroupChat.',
    },
    {
      id: 3,
      timestamp: '2024-03-07 10:15:03.120',
      level: 'INFO',
      agent: 'Researcher',
      message: 'Querying Azure Cosmos DB for past project kickoff templates...',
    },
    {
      id: 4,
      timestamp: '2024-03-07 10:15:04.005',
      level: 'SUCCESS',
      agent: 'Researcher',
      message: 'Retrieved 2 relevant templates. Passing context to Executor.',
    },
    {
      id: 5,
      timestamp: '2024-03-07 10:15:04.890',
      level: 'WARN',
      agent: 'Executor',
      message: 'Microsoft Graph API rate limit approaching (85% utilization).',
    },
    {
      id: 6,
      timestamp: '2024-03-07 10:15:06.200',
      level: 'INFO',
      agent: 'Executor',
      message: 'Drafting kickoff email and generating Outlook calendar invite.',
    },
    {
      id: 7,
      timestamp: '2024-03-07 10:15:07.550',
      level: 'ERROR',
      agent: 'Reviewer',
      message: 'Hallucination detected: Suggested time slot conflicts with existing all-hands meeting.',
    },
    {
      id: 8,
      timestamp: '2024-03-07 10:15:08.100',
      level: 'INFO',
      agent: 'Planner',
      message: 'Re-routing task to Executor to find alternative time slot.',
    },
    {
      id: 9,
      timestamp: '2024-03-07 10:15:10.400',
      level: 'SUCCESS',
      agent: 'Reviewer',
      message: 'Validation passed. Payload ready for Human-in-the-Loop (HITL) approval.',
    }
  ];

  // Helper function to render the correct icon and color based on log level
  const getLevelBadge = (level) => {
    switch (level) {
      case 'INFO':
        return <span className="flex items-center gap-1.5 text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"><Info size={12} /> INFO</span>;
      case 'SUCCESS':
        return <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"><CheckCircle2 size={12} /> OK</span>;
      case 'WARN':
        return <span className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"><AlertTriangle size={12} /> WARN</span>;
      case 'ERROR':
        return <span className="flex items-center gap-1.5 text-red-400 bg-red-400/10 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"><AlertCircle size={12} /> ERR</span>;
      default:
        return null;
    }
  };

  // Helper function to colorize agent names in the logs
  const getAgentColor = (agent) => {
    switch (agent) {
      case 'Planner': return 'text-blue-300';
      case 'Researcher': return 'text-purple-300';
      case 'Executor': return 'text-amber-300';
      case 'Reviewer': return 'text-emerald-300';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6 h-full flex flex-col">
            
            {/* Page Header */}
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 text-slate-500 font-medium">
                  <TerminalSquare size={20} />
                  <span>Observability</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900">System & Agent Logs</h1>
                <p className="text-gray-500 mt-1">Raw telemetry and communication bus output from Azure Container Apps.</p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsLive(!isLive)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm ${
                    isLive 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100' 
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {isLive ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current" />}
                  {isLive ? 'Pause Stream' : 'Resume Stream'}
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-slate-700 shadow-sm">
                  <Download size={16} />
                  Export .log
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {['All', 'Planner', 'Researcher', 'Executor', 'Reviewer', 'System'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-black text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search payloads..." 
                    className="pl-9 pr-4 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors w-64 text-sm bg-gray-50 focus:bg-white"
                  />
                </div>
                <button className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-colors">
                  <Filter size={18} />
                </button>
              </div>
            </div>

            {/* Log Viewer Container */}
            <div className="flex-1 bg-[#0f111a] rounded-2xl border border-slate-800 shadow-inner overflow-hidden flex flex-col font-mono text-sm">
              <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-800/50 bg-[#151822]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                </div>
                <span className="text-slate-500 text-xs font-bold tracking-widest uppercase">Azure Service Bus Console</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {mockLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 hover:bg-white/5 p-1 rounded transition-colors">
                    <span className="text-slate-500 w-48 flex-shrink-0">{log.timestamp}</span>
                    <div className="w-20 flex-shrink-0">
                      {getLevelBadge(log.level)}
                    </div>
                    <span className={`w-28 flex-shrink-0 font-bold ${getAgentColor(log.agent)}`}>
                      [{log.agent}]
                    </span>
                    <span className="text-slate-300 flex-1 break-words">
                      {log.message}
                    </span>
                  </div>
                ))}
                
                {isLive && (
                  <div className="flex items-center gap-2 text-slate-500 pt-4 animate-pulse">
                    <div className="w-2 h-4 bg-slate-500"></div>
                    <span>Listening for new events...</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Logs;