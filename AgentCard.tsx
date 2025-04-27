import React from 'react';
import { useDrag } from 'react-dnd';

interface AgentCardProps {
  id: number;
  name: string;
  role: string;
  personality: string;
}

const AgentCard: React.FC<AgentCardProps> = ({ id, name, role, personality }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'agent',
    item: { id, name, role, personality },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`agent-card p-4 mb-3 rounded-lg shadow cursor-move ${
        isDragging ? 'opacity-50 border-2 border-blue-500' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#f8f9fa' }}
    >
      <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
      <div className="text-sm text-gray-600 font-medium mt-1">{role}</div>
      <div className="text-xs text-gray-500 mt-2">Personality: {personality}</div>
      <div className="mt-3 flex justify-end">
        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
          Drag to sandbox
        </span>
      </div>
    </div>
  );
};

export default AgentCard;
