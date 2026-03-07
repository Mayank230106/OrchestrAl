import React from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Clock, 
  ChevronRight,
  Activity,
  Plus
} from 'lucide-react';

const History = () => {
  // Hardcoded data based on the mockup
  const tasks = [
    {
      id: 1,
      name: 'Project Kickoff Setup',
      status: 'Completed',
      agents: [
        { initial: 'P', color: 'bg-blue-500' },
        { initial: 'R', color: 'bg-purple-500' },
        { initial: 'E', color: 'bg-orange-500' },
        { initial: 'R', color: 'bg-emerald-500' },
      ],
      date: '2024-03-06 10:15 AM',
      duration: '6.2s',
    },
    {
      id: 2,
      name: 'Weekly Report Generation',
      status: 'Completed',
      agents: [
        { initial: 'P', color: 'bg-blue-500' },
        { initial: 'R', color: 'bg-purple-500' },
        { initial: 'E', color: 'bg-orange-500' },
      ],
      date: '2024-03-05 02:30 PM',
      duration: '4.8s',
    },
    {
      id: 3,
      name: 'Stakeholder Email Draft',
      status: 'Failed',
      agents: [
        { initial: 'P', color: 'bg-blue-500' },
        { initial: 'E', color: 'bg-orange-500' },
      ],
      date: '2024-03-05 11:00 AM',
      duration: '1.5s',
    },
    {
      id: 4,
      name: 'Market Research Analysis',
      status: 'Completed',
      agents: [
        { initial: 'P', color: 'bg-blue-500' },
        { initial: 'R', color: 'bg-purple-500' },
        { initial: 'R', color: 'bg-emerald-500' },
      ],
      date: '2024-03-04 09:45 AM',
      duration: '12.4s',
    },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Bar (Placeholder for Navbar) */}
        <Navbar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Header Area */}
            <div className="flex items-end justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Task History</h1>
                <p className="text-gray-500">Review past orchestrations and their outcomes.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search tasks..." 
                    className="pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors w-64 text-sm"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-slate-700 shadow-sm">
                  <Filter size={16} />
                  Filter
                </button>
              </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Task</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Agents</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                      
                      {/* Task Name */}
                      <td className="px-6 py-5">
                        <span className="font-bold text-slate-900">{task.name}</span>
                      </td>
                      
                      {/* Status */}
                      <td className="px-6 py-5">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          task.status === 'Completed' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {task.status === 'Completed' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          {task.status}
                        </div>
                      </td>
                      
                      {/* Agents (Overlapping Avatars) */}
                      <td className="px-6 py-5">
                        <div className="flex items-center">
                          {task.agents.map((agent, index) => (
                            <div 
                              key={index} 
                              className={`w-7 h-7 rounded-full ${agent.color} text-white flex items-center justify-center text-xs font-bold border-2 border-white ${index !== 0 ? '-ml-2' : ''} shadow-sm`}
                            >
                              {agent.initial}
                            </div>
                          ))}
                        </div>
                      </td>
                      
                      {/* Date */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                          <Calendar size={16} className="text-gray-400" />
                          {task.date}
                        </div>
                      </td>
                      
                      {/* Duration */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                          <Clock size={16} className="text-gray-400" />
                          {task.duration}
                        </div>
                      </td>
                      
                      {/* Arrow Icon */}
                      <td className="px-6 py-5 text-right">
                        <ChevronRight size={20} className="text-gray-300 group-hover:text-black transition-colors" />
                      </td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default History;