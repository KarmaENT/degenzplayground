import React, { useEffect, useState } from 'react';
import { useWebSocket, useAIService } from '../../services/AIService';

interface AgentResponse {
  id: number;
  content: string;
  agent_name: string;
  agent_role: string;
  timestamp: string;
}

interface SandboxIntegrationProps {
  sessionId: number;
  agents: any[];
}

const SandboxIntegration: React.FC<SandboxIntegrationProps> = ({ sessionId, agents }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const { socket, isConnected, connectToSession, sendMessage } = useWebSocket();
  const { sendUserMessage } = useAIService();
  const [clientId] = useState(`client-${Date.now()}`);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    if (sessionId) {
      connectToSession(sessionId.toString(), clientId);
    }

    return () => {
      // Cleanup
    };
  }, [sessionId, clientId, connectToSession]);

  // Listen for messages from WebSocket
  useEffect(() => {
    if (socket) {
      // Handle agent messages
      socket.on('agent_message', (data: AgentResponse) => {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            content: data.content,
            sender: 'agent',
            agentName: data.agent_name,
            agentRole: data.agent_role,
            timestamp: data.timestamp || new Date().toISOString()
          }
        ]);
      });

      // Handle system notifications
      socket.on('notification', (data: any) => {
        console.log('System notification:', data);
        // Handle system notifications if needed
      });
    }
  }, [socket]);

  // Send a message to the backend
  const handleSendMessage = async (content: string) => {
    try {
      // Add user message to local state
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          content,
          sender: 'user',
          timestamp: new Date().toISOString()
        }
      ]);

      // Send message to backend via API
      await sendUserMessage(sessionId, content);

      // The response will come through the WebSocket
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return {
    messages,
    isConnected,
    handleSendMessage
  };
};

export default SandboxIntegration;
