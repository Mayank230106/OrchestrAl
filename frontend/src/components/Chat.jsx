import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

const Chat = ({ onSend, isProcessing }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend(input);
    if (!isProcessing) setInput('');
  };

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <h1 className="text-4xl font-bold text-slate-900 mb-2">
        What should the team do today?
      </h1>
      <p className="text-gray-500 mb-6">
        Enter a high-level request and watch the agents collaborate.
      </p>
      
      <form onSubmit={handleSubmit} className="relative w-full max-w-3xl">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isProcessing}
          placeholder="e.g. Set up a project kickoff for next Tuesday..."
          className="w-full pl-6 pr-14 py-4 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-lg disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
        />
        <button 
          type="submit"
          disabled={isProcessing || !input.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-200 disabled:opacity-50"
        >
          {isProcessing ? <Loader2 size={24} className="animate-spin text-black" /> : <Send size={24} />}
        </button>
      </form>
    </div>
  );
};

export default Chat;