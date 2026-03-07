// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Chat from '../components/Chat';
import Active from '../components/Active';
import CommandLine from '../components/CommandLine';
import { startWorkflow, streamWorkflow } from '../lib/api';

const Dashboard = () => {
  const [activeStep, setActiveStep] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [liveLogs, setLiveLogs] = useState([]);

  const agentMap = { Planner: 0, Researcher: 1, Executor: 2, Reviewer: 3 };

  const handleStartOrchestration = async (prompt) => {
    if (!prompt.trim() || isProcessing) return;
    setIsProcessing(true);
    setActiveStep(0);
    setLiveLogs([]);

    try {
      // 1. POST to start the workflow
      const data = await startWorkflow(prompt);
      setCurrentSessionId(data.session_id);

      // 2. Open SSE stream to listen to AutoGen agents
      const eventSource = streamWorkflow(data.session_id);

      eventSource.onmessage = (event) => {
        const streamData = JSON.parse(event.data);

        if (streamData.new_logs && streamData.new_logs.length > 0) {
          const latestLog = streamData.new_logs[streamData.new_logs.length - 1];
          if (agentMap[latestLog.agent] !== undefined) {
            setActiveStep(agentMap[latestLog.agent]);
          }
          // Accumulate real logs for the CommandLine terminal
          setLiveLogs((prev) => [...prev, ...streamData.new_logs]);
        }

        if (['PAUSED_FOR_HITL', 'COMPLETED', 'FAILED'].includes(streamData.status)) {
          eventSource.close();
          setIsProcessing(false);
          setActiveStep(4); // Push past all agents to show all completed
        }
      };

      eventSource.onerror = () => {
        console.error('SSE stream connection lost.');
        eventSource.close();
        setIsProcessing(false);
      };
    } catch (error) {
      console.error('Failed to start workflow:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="w-full max-w-[1600px] mx-auto space-y-6 flex flex-col">
            <Chat onSend={handleStartOrchestration} isProcessing={isProcessing} />
            <Active activeStep={activeStep} />
            {/* Pass real live logs from backend SSE stream */}
            <CommandLine activeStep={activeStep} logs={liveLogs} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;