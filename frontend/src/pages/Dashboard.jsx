import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Chat from '../components/Chat';
import Active from '../components/Active';
import CommandLine from '../components/CommandLine';

const Dashboard = () => {
  const [activeStep, setActiveStep] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);

  // This simulates the agents talking to each other
  const handleStartOrchestration = (prompt) => {
    if (!prompt.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setActiveStep(0); // Start Planner animation
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep += 1;
      setActiveStep(currentStep);
      
      // Stop when all 4 agents are done
      if (currentStep > 3) {
        clearInterval(interval);
        setIsProcessing(false);
      }
    }, 2500); // 2.5 seconds per agent
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
            <CommandLine activeStep={activeStep} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;