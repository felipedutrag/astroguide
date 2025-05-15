// src/components/ChatInterface.tsx
import React, { useRef, useEffect } from 'react';
import SendIcon from './SendIcon';

type ChatMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  chatLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatHistory,
  chatInput,
  setChatInput,
  chatLoading,
  onSubmit,
}) => {
  const chatBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      <h3 className="text-md lg:text-lg font-semibold text-gray-700 mb-2 text-center flex-shrink-0">Chat de Sinastria</h3>
      <div
        ref={chatBoxRef}
        className="flex-1 overflow-y-auto bg-gray-50 rounded-lg border border-gray-200 p-3 md:p-4 mb-2 shadow-inner"
        id="chat-box"
      >
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`mb-2.5 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-2 md:px-3 md:py-2 rounded-lg shadow-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
              <pre className="text-sm whitespace-pre-wrap font-sans">{msg.parts[0]?.text || ""}</pre>
            </div>
          </div>
        ))}
        {chatLoading && (
          <div className="text-left mb-2.5 flex justify-start">
            <span className="inline-block bg-gray-200 text-gray-800 rounded-lg px-3 py-2 animate-pulse shadow-sm">
              Gemini está digitando...
            </span>
          </div>
        )}
      </div>
      <form onSubmit={onSubmit} className="flex gap-2 mt-auto flex-shrink-0">
        <input
          type="text"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          placeholder="Pergunte sobre a sinastria..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 placeholder-gray-400"
          disabled={chatLoading}
          required
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold px-4 py-2 rounded-lg shadow hover:from-blue-700 hover:to-blue-600 transition border border-blue-500 disabled:opacity-70"
          disabled={chatLoading || !chatInput.trim()}
        >
          Enviar
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
