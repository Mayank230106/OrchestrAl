import React, { useEffect, useRef } from 'react';
import { Terminal, MessageSquare, Sparkles, CheckCircle2, Circle, Loader2 } from 'lucide-react';

const CommandLine = ({ activeStep = -1 }) => {
  const terminalEndRef = useRef(null);

  // 1. Synchronized Terminal Logs
  // These logs appear progressively based on which agent is active
  const getLogs = () => {
    const logs = [];
    if (activeStep >= 0) {
      logs.push({ time: '0.0s', agent: 'SYSTEM', color: 'text-gray-400', msg: 'Incoming request received. Initializing GroupChat.' });
      logs.push({ time: '0.2s', agent: 'PLANNER', color: 'text-blue-400', msg: 'Decomposing request into 3 logical subtasks...' });
    }
    if (activeStep >= 1) {
      logs.push({ time: '2.5s', agent: 'RESEARCHER', color: 'text-purple-400', msg: 'Querying internal documents for project context.' });
      logs.push({ time: '3.8s', agent: 'RESEARCHER', color: 'text-purple-400', msg: 'Context retrieved. Passing data to Executor.' });
    }
    if (activeStep >= 2) {
      logs.push({ time: '5.0s', agent: 'EXECUTOR', color: 'text-amber-400', msg: 'Hitting Microsoft Graph API to find calendar slot.' });
      logs.push({ time: '6.4s', agent: 'EXECUTOR', color: 'text-amber-400', msg: 'Slot found. Drafting summary email.' });
    }
    if (activeStep >= 3) {
      logs.push({ time: '7.5s', agent: 'REVIEWER', color: 'text-emerald-400', msg: 'Sanity checking output against original request.' });
      logs.push({ time: '8.9s', agent: 'REVIEWER', color: 'text-emerald-400', msg: 'Validation passed. No hallucinations detected.' });
    }
    if (activeStep > 3) {
      logs.push({ time: '10.0s', agent: 'SYSTEM', color: 'text-gray-400', msg: 'Workflow paused. Awaiting Human-in-the-Loop (HITL) approval.' });
    }
    return logs;
  };

  // 2. Synchronized Task Breakdown
  // These tasks are "created" by the Planner and completed by the others
  const tasks = [
    { id: 1, title: 'Gather project context', assigned: 'Researcher', activeAt: 1 },
    { id: 2, title: 'Draft kickoff summary', assigned: 'Executor', activeAt: 2 },
    { id: 3, title: 'Verify schedule & validate', assigned: 'Reviewer', activeAt: 3 },
  ];

  const currentLogs = getLogs();

  // Auto-scroll the terminal to the bottom as new logs appear
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentLogs.length]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full pb-8">
      {/* Agent Communication Logs (Terminal) */}
      <div className="lg:col-span-2 flex flex-col">
        <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-sm uppercase tracking-wide">
          <Terminal size={18} />
          <span>Agent Communication Logs</span>
        </div>
        
        <div className="bg-[#0f111a] rounded-2xl min-h-[450px] max-h-[450px] w-full p-6 shadow-inner flex flex-col font-mono text-sm overflow-y-auto relative">
          {activeStep === -1 ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-slate-500 italic">Waiting for command...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {currentLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <span className="text-slate-500 w-12 flex-shrink-0">[{log.time}]</span>
                  <span className={`${log.color} w-24 flex-shrink-0 font-bold`}>{log.agent}</span>
                  <span className="text-slate-300 flex-1">{log.msg}</span>
                </div>
              ))}
              {/* Blinking cursor effect while processing */}
              {activeStep <= 3 && (
                <div className="flex items-center gap-2 text-slate-500 pt-2 animate-pulse">
                  <div className="w-2 h-4 bg-slate-500"></div>
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Task Breakdown */}
      <div className="lg:col-span-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-sm uppercase tracking-wide">
          <MessageSquare size={18} />
          <span>Task Breakdown</span>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-2xl min-h-[450px] max-h-[450px] w-full p-6 shadow-sm flex flex-col overflow-y-auto">
          {activeStep === -1 ? (
            <div className="flex flex-col items-center justify-center text-center h-full">
              <div className="text-gray-300 mb-4">
                <Sparkles size={36} />
              </div>
              <p className="text-sm text-gray-400 max-w-[220px]">
                Tasks will appear here once the Planner decomposes your request.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-100 mb-2">
                <h3 className="font-bold text-slate-900">Generated Plan</h3>
                <p className="text-xs text-gray-500 mt-1">Decomposed by The Planner</p>
              </div>
              
              <div className="space-y-3">
                {tasks.map((task) => {
                  const isPending = activeStep < task.activeAt;
                  const isActive = activeStep === task.activeAt;
                  const isDone = activeStep > task.activeAt;

                  return (
                    <div 
                      key={task.id} 
                      className={`p-4 rounded-xl border transition-all duration-300 flex items-start gap-3 ${
                        isActive ? 'border-blue-200 bg-blue-50 shadow-sm' : 
                        isDone ? 'border-gray-100 bg-gray-50/50' : 'border-dashed border-gray-200 opacity-50'
                      }`}
                    >
                      <div className="mt-0.5">
                        {isDone ? (
                          <CheckCircle2 size={18} className="text-emerald-500" />
                        ) : isActive ? (
                          <Loader2 size={18} className="text-blue-500 animate-spin" />
                        ) : (
                          <Circle size={18} className="text-gray-300" />
                        )}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${isDone ? 'text-gray-600 line-through' : 'text-slate-800'}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Assigned: {task.assigned}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandLine;