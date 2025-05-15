// src/components/SinastriaModal.tsx
import React, { useState } from 'react';
import PlanetaryDataTable from './PlanetaryDataTable';
import ChatInterface from './ChatInterface';

type ChatMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

interface SinastriaModalProps {
  person1: any;
  person2: any;
  result1: any;
  result2: any;
  chatHistory: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  chatLoading: boolean;
  onChatSubmit: (e: React.FormEvent) => void;
  show: boolean;
  onClose: () => void;
}

const SinastriaModal: React.FC<SinastriaModalProps> = ({
  person1,
  person2,
  result1,
  result2,
  chatHistory,
  chatInput,
  setChatInput,
  chatLoading,
  onChatSubmit,
  show,
  onClose,
}) => {
  const [expandedTable, setExpandedTable] = useState<'person1' | 'person2'>('person1');

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-100 w-full h-full">
      <div className="absolute inset-0 bg-white bg-opacity-95" />
      <div className="relative z-10 flex flex-col w-full h-full max-h-screen p-4 md:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-8 text-gray-400 hover:text-gray-700 text-4xl font-bold z-20"
          aria-label="Fechar modal"
        >
          &times;
        </button>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-700 mb-4 text-center pt-6 md:pt-2">
          Sinastria
        </h2>
        <div className="flex flex-1 flex-col md:flex-row gap-4 md:gap-6 overflow-hidden">
          <div className="md:w-1/3 flex flex-col gap-4 overflow-y-auto p-1">
            <PlanetaryDataTable
              personName={person1.name}
              planetaryData={result1}
              isExpanded={expandedTable === 'person1'}
              onToggle={() => setExpandedTable('person1')}
              accentColor="text-sky-400"
            />
            <PlanetaryDataTable
              personName={person2.name}
              planetaryData={result2}
              isExpanded={expandedTable === 'person2'}
              onToggle={() => setExpandedTable('person2')}
              accentColor="text-teal-400"
            />
          </div>
          <ChatInterface
            chatHistory={chatHistory}
            chatInput={chatInput}
            setChatInput={setChatInput}
            chatLoading={chatLoading}
            onSubmit={onChatSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default SinastriaModal;
