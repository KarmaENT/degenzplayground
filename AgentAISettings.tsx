import React, { useState, useEffect } from 'react';
import { FaRobot, FaCog, FaInfoCircle } from 'react-icons/fa';
import AIProviderSettings from './AIProviderSettings';

const AgentAISettings = () => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agents, setAgents] = useState([]);
  const [providerSettings, setProviderSettings] = useState({
    provider: 'gemini',
    model: '',
    temperature: 0.7,
    maxTokens: 1024,
    systemPrompt: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch agents on component mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, this would be an API call
        // const response = await fetch('/api/agents');
        // const data = await response.json();
        
        // Mock data for demonstration
        const mockAgents = [
          { id: 1, name: 'Researcher', role: 'Research Assistant', personality: 'Analytical' },
          { id: 2, name: 'Copywriter', role: 'Content Creator', personality: 'Creative' },
          { id: 3, name: 'Designer', role: 'Visual Designer', personality: 'Artistic' },
          { id: 4, name: 'Manager', role: 'Project Manager', personality: 'Organized' }
        ];
        
        setAgents(mockAgents);
        
        if (mockAgents.length > 0) {
          setSelectedAgent(mockAgents[0]);
          
          // Load saved settings for this agent
          const savedSettings = JSON.parse(localStorage.getItem(`agentAISettings_${mockAgents[0].id}`) || 'null');
          if (savedSettings) {
            setProviderSettings(savedSettings);
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load agents', err);
        setIsLoading(false);
      }
    };
    
    fetchAgents();
  }, []);

  // Handle agent selection
  const handleAgentSelect = (agent) => {
    setSelectedAgent(agent);
    
    // Load saved settings for this agent
    const savedSettings = JSON.parse(localStorage.getItem(`agentAISettings_${agent.id}`) || 'null');
    if (savedSettings) {
      setProviderSettings(savedSettings);
    } else {
      // Default settings
      setProviderSettings({
        provider: 'gemini',
        model: '',
        temperature: 0.7,
        maxTokens: 1024,
        systemPrompt: ''
      });
    }
  };

  // Handle settings change
  const handleSettingsChange = (field, value) => {
    const newSettings = { ...providerSettings, [field]: value };
    setProviderSettings(newSettings);
    
    // Save settings for this agent
    if (selectedAgent) {
      localStorage.setItem(`agentAISettings_${selectedAgent.id}`, JSON.stringify(newSettings));
    }
  };

  // Handle provider change from AIProviderSettings component
  const handleProviderChange = (provider, model) => {
    const newSettings = { 
      ...providerSettings, 
      provider: provider,
      model: model
    };
    setProviderSettings(newSettings);
    
    // Save settings for this agent
    if (selectedAgent) {
      localStorage.setItem(`agentAISettings_${selectedAgent.id}`, JSON.stringify(newSettings));
    }
  };

  if (isLoading) {
    return <div className="loading-spinner">Loading agent AI settings...</div>;
  }

  return (
    <div className="agent-ai-settings">
      <h2 className="settings-section-title">Agent AI Settings</h2>
      <p className="settings-section-description">
        Configure AI settings for each agent in your workspace.
      </p>
      
      <div className="settings-layout">
        <div className="agent-selector">
          <h3>Select Agent</h3>
          <div className="agent-list">
            {agents.map(agent => (
              <div 
                key={agent.id}
                className={`agent-item ${selectedAgent && selectedAgent.id === agent.id ? 'selected' : ''}`}
                onClick={() => handleAgentSelect(agent)}
              >
                <div className="agent-icon">
                  <FaRobot />
                </div>
                <div className="agent-info">
                  <div className="agent-name">{agent.name}</div>
                  <div className="agent-role">{agent.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {selectedAgent && (
          <div className="agent-settings">
            <h3>AI Settings for {selectedAgent.name}</h3>
            
            <div className="settings-group">
              <h4>AI Provider Configuration</h4>
              <AIProviderSettings 
                onProviderChange={handleProviderChange}
                initialProvider={providerSettings.provider}
                initialModel={providerSettings.model}
              />
            </div>
            
            <div className="settings-group">
              <h4>Generation Parameters</h4>
              
              <div className="form-group">
                <label htmlFor="temperature">
                  Temperature: {providerSettings.temperature}
                  <span className="tooltip-icon">
                    <FaInfoCircle />
                    <span className="tooltip-text">
                      Controls randomness: lower values are more deterministic, higher values more creative.
                    </span>
                  </span>
                </label>
                <input
                  id="temperature"
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={providerSettings.temperature}
                  onChange={(e) => handleSettingsChange('temperature', parseFloat(e.target.value))}
                  className="range-slider"
                />
                <div className="range-labels">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="maxTokens">
                  Max Tokens: {providerSettings.maxTokens}
                  <span className="tooltip-icon">
                    <FaInfoCircle />
                    <span className="tooltip-text">
                      Maximum length of generated responses.
                    </span>
                  </span>
                </label>
                <select
                  id="maxTokens"
                  value={providerSettings.maxTokens}
                  onChange={(e) => handleSettingsChange('maxTokens', parseInt(e.target.value))}
                  className="form-select"
                >
                  <option value="512">512 tokens (Short)</option>
                  <option value="1024">1024 tokens (Medium)</option>
                  <option value="2048">2048 tokens (Long)</option>
                  <option value="4096">4096 tokens (Very Long)</option>
                </select>
              </div>
            </div>
            
            <div className="settings-group">
              <h4>System Instructions</h4>
              <div className="form-group">
                <label htmlFor="systemPrompt">
                  System Prompt
                  <span className="tooltip-icon">
                    <FaInfoCircle />
                    <span className="tooltip-text">
                      Instructions that define how the agent should behave.
                    </span>
                  </span>
                </label>
                <textarea
                  id="systemPrompt"
                  value={providerSettings.systemPrompt}
                  onChange={(e) => handleSettingsChange('systemPrompt', e.target.value)}
                  placeholder={`Enter system instructions for ${selectedAgent.name}...`}
                  rows={5}
                  className="form-textarea"
                />
              </div>
              
              <div className="system-prompt-templates">
                <h5>Templates:</h5>
                <button 
                  onClick={() => handleSettingsChange('systemPrompt', `You are ${selectedAgent.name}, a ${selectedAgent.role} with a ${selectedAgent.personality} personality. Your goal is to help the user by providing insightful analysis and information.`)}
                  className="btn btn-sm"
                >
                  Basic Template
                </button>
                <button 
                  onClick={() => handleSettingsChange('systemPrompt', `You are ${selectedAgent.name}, a ${selectedAgent.role} with a ${selectedAgent.personality} personality. Always respond in a professional tone and focus on providing accurate, well-researched information. Cite sources when possible and acknowledge limitations in your knowledge.`)}
                  className="btn btn-sm"
                >
                  Professional Template
                </button>
                <button 
                  onClick={() => handleSettingsChange('systemPrompt', `You are ${selectedAgent.name}, a ${selectedAgent.role} with a ${selectedAgent.personality} personality. Be creative, think outside the box, and don't be afraid to suggest unconventional ideas. Your goal is to inspire the user and help them explore new possibilities.`)}
                  className="btn btn-sm"
                >
                  Creative Template
                </button>
              </div>
            </div>
            
            <div className="settings-actions">
              <button className="btn btn-primary">
                <FaCog /> Save Agent Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentAISettings;
