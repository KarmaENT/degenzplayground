import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSliders, FaCog, FaSave, FaUndo, FaFlask, FaInfoCircle } from 'react-icons/fa';

interface AgentVersion {
  id: number;
  agent_id: number;
  version_number: number;
  name: string;
  role: string;
  personality: string;
  system_instructions: string;
  examples: Record<string, any>;
  parameters: Record<string, any>;
  created_at: string;
  created_by_id: number;
  is_active: boolean;
}

interface AgentFineTuningProps {
  agentId: number;
  agentName: string;
  onVersionCreated?: (versionId: number) => void;
}

const AgentFineTuning: React.FC<AgentFineTuningProps> = ({ 
  agentId, 
  agentName,
  onVersionCreated 
}) => {
  const [agent, setAgent] = useState<any>(null);
  const [versions, setVersions] = useState<AgentVersion[]>([]);
  const [parameters, setParameters] = useState<Record<string, any>>({
    temperature: 0.7,
    top_p: 1.0,
    max_tokens: 1000,
    presence_penalty: 0.0,
    frequency_penalty: 0.0,
    response_format: 'auto',
    creativity_level: 'balanced',
    verbosity_level: 'balanced',
    formality_level: 'balanced'
  });
  const [originalParameters, setOriginalParameters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [tooltips, setTooltips] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAgentData();
  }, [agentId]);

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch agent details
      const agentResponse = await axios.get(`/api/agents/${agentId}`);
      setAgent(agentResponse.data);
      
      // Fetch agent versions
      const versionsResponse = await axios.get(`/api/agent_versions/?agent_id=${agentId}`);
      setVersions(versionsResponse.data);
      
      // Set initial parameters from the active version or defaults
      const activeVersion = versionsResponse.data.find((v: AgentVersion) => v.is_active);
      if (activeVersion && activeVersion.parameters) {
        setParameters(activeVersion.parameters);
        setOriginalParameters(activeVersion.parameters);
      } else {
        // If no active version with parameters, use defaults
        const defaultParams = {
          temperature: 0.7,
          top_p: 1.0,
          max_tokens: 1000,
          presence_penalty: 0.0,
          frequency_penalty: 0.0,
          response_format: 'auto',
          creativity_level: 'balanced',
          verbosity_level: 'balanced',
          formality_level: 'balanced'
        };
        setParameters(defaultParams);
        setOriginalParameters(defaultParams);
      }
      
    } catch (err) {
      setError('Failed to load agent data');
      console.error('Error fetching agent data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleParameterChange = (param: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const resetParameters = () => {
    setParameters(originalParameters);
  };

  const saveParameters = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Create a new agent version with the updated parameters
      const response = await axios.post('/api/agent_versions/', {
        agent_id: agentId,
        name: agent.name,
        role: agent.role,
        personality: agent.personality,
        system_instructions: agent.system_instructions,
        examples: agent.examples,
        parameters: parameters,
        is_active: true
      });
      
      setSuccess('Parameters saved successfully!');
      setOriginalParameters(parameters);
      
      // Add the new version to the versions list
      setVersions(prev => [response.data, ...prev]);
      
      if (onVersionCreated) {
        onVersionCreated(response.data.id);
      }
      
    } catch (err) {
      setError('Failed to save parameters');
      console.error('Error saving parameters:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleTooltip = (param: string) => {
    setTooltips(prev => ({
      ...prev,
      [param]: !prev[param]
    }));
  };

  const getParameterDescription = (param: string) => {
    const descriptions: Record<string, string> = {
      temperature: 'Controls randomness. Higher values (e.g., 0.8) make output more random, lower values (e.g., 0.2) make it more focused and deterministic.',
      top_p: 'Controls diversity via nucleus sampling. 0.5 means half of all likelihood-weighted options are considered.',
      max_tokens: 'The maximum number of tokens that can be generated in the response.',
      presence_penalty: 'Positive values penalize new tokens based on whether they appear in the text so far, increasing the model\'s likelihood to talk about new topics.',
      frequency_penalty: 'Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model\'s likelihood to repeat the same line verbatim.',
      response_format: 'Specifies the format in which the model should return its response.',
      creativity_level: 'Controls the overall creativity of responses from conservative to highly creative.',
      verbosity_level: 'Controls how detailed and lengthy the responses will be.',
      formality_level: 'Controls the tone from casual to highly formal.'
    };
    
    return descriptions[param] || 'No description available';
  };

  if (loading) {
    return <div className="p-4 text-center">Loading fine-tuning interface...</div>;
  }

  if (!agent) {
    return <div className="p-4 text-center text-red-500">Failed to load agent data</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <FaSliders className="mr-2 text-purple-400" />
          {agentName} Fine-Tuning
        </h2>
      </div>
      
      {error && (
        <div className="bg-red-900 text-white p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-900 text-white p-3 rounded mb-4 text-sm">
          {success}
        </div>
      )}
      
      <div className="mb-4">
        <div className="flex border-b border-gray-700">
          <button 
            className={`py-2 px-4 font-medium ${activeTab === 'basic' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Parameters
          </button>
          <button 
            className={`py-2 px-4 font-medium ${activeTab === 'advanced' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('advanced')}
          >
            Advanced Parameters
          </button>
          <button 
            className={`py-2 px-4 font-medium ${activeTab === 'versions' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('versions')}
          >
            Version History
          </button>
        </div>
      </div>
      
      {activeTab === 'basic' && (
        <div className="space-y-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <h3 className="text-md font-semibold">Creativity Level</h3>
                <button 
                  className="ml-2 text-gray-400 hover:text-white"
                  onClick={() => toggleTooltip('creativity_level')}
                >
                  <FaInfoCircle />
                </button>
              </div>
              <div className="text-sm font-medium">
                {parameters.creativity_level === 'conservative' ? 'Conservative' :
                 parameters.creativity_level === 'balanced' ? 'Balanced' :
                 parameters.creativity_level === 'creative' ? 'Creative' : 'Highly Creative'}
              </div>
            </div>
            
            {tooltips.creativity_level && (
              <div className="bg-gray-800 p-2 rounded text-sm mb-2">
                Controls the overall creativity of responses from conservative (factual, predictable) to highly creative (imaginative, unexpected).
              </div>
            )}
            
            <input 
              type="range" 
              min="0" 
              max="3" 
              step="1"
              value={
                parameters.creativity_level === 'conservative' ? 0 :
                parameters.creativity_level === 'balanced' ? 1 :
                parameters.creativity_level === 'creative' ? 2 : 3
              }
              onChange={(e) => {
                const value = parseInt(e.target.value);
                const level = value === 0 ? 'conservative' :
                             value === 1 ? 'balanced' :
                             value === 2 ? 'creative' : 'highly_creative';
                handleParameterChange('creativity_level', level);
                
                // Also update temperature based on creativity level
                const temp = value === 0 ? 0.3 :
                            value === 1 ? 0.7 :
                            value === 2 ? 0.9 : 1.1;
                handleParameterChange('temperature', temp);
              }}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Conservative</span>
              <span>Balanced</span>
              <span>Creative</span>
              <span>Highly Creative</span>
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <h3 className="text-md font-semibold">Verbosity Level</h3>
                <button 
                  className="ml-2 text-gray-400 hover:text-white"
                  onClick={() => toggleTooltip('verbosity_level')}
                >
                  <FaInfoCircle />
                </button>
              </div>
              <div className="text-sm font-medium">
                {parameters.verbosity_level === 'concise' ? 'Concise' :
                 parameters.verbosity_level === 'balanced' ? 'Balanced' :
                 parameters.verbosity_level === 'detailed' ? 'Detailed' : 'Comprehensive'}
              </div>
            </div>
            
            {tooltips.verbosity_level && (
              <div className="bg-gray-800 p-2 rounded text-sm mb-2">
                Controls how detailed and lengthy the responses will be, from brief and to-the-point to comprehensive and thorough.
              </div>
            )}
            
            <input 
              type="range" 
              min="0" 
              max="3" 
              step="1"
              value={
                parameters.verbosity_level === 'concise' ? 0 :
                parameters.verbosity_level === 'balanced' ? 1 :
                parameters.verbosity_level === 'detailed' ? 2 : 3
              }
              onChange={(e) => {
                const value = parseInt(e.target.value);
                const level = value === 0 ? 'concise' :
                             value === 1 ? 'balanced' :
                             value === 2 ? 'detailed' : 'comprehensive';
                handleParameterChange('verbosity_level', level);
                
                // Also update max_tokens based on verbosity level
                const tokens = value === 0 ? 500 :
                              value === 1 ? 1000 :
                              value === 2 ? 2000 : 4000;
                handleParameterChange('max_tokens', tokens);
              }}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Concise</span>
              <span>Balanced</span>
              <span>Detailed</span>
              <span>Comprehensive</span>
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <h3 className="text-md font-semibold">Formality Level</h3>
                <button 
                  className="ml-2 text-gray-400 hover:text-white"
                  onClick={() => toggleTooltip('formality_level')}
                >
                  <FaInfoCircle />
                </button>
              </div>
              <div className="text-sm font-medium">
                {parameters.formality_level === 'casual' ? 'Casual' :
                 parameters.formality_level === 'balanced' ? 'Balanced' :
                 parameters.formality_level === 'formal' ? 'Formal' : 'Academic'}
              </div>
            </div>
            
            {tooltips.formality_level && (
              <div className="bg-gray-800 p-2 rounded text-sm mb-2">
                Controls the tone from casual and conversational to highly formal and academic.
              </div>
            )}
            
            <input 
              type="range" 
              min="0" 
              max="3" 
              step="1"
              value={
                parameters.formality_level === 'casual' ? 0 :
                parameters.formality_level === 'balanced' ? 1 :
                parameters.formality_level === 'formal' ? 2 : 3
              }
              onChange={(e) => {
                const value = parseInt(e.target.value);
                const level = value === 0 ? 'casual' :
                             value === 1 ? 'balanced' :
                             value === 2 ? 'formal' : 'academic';
                handleParameterChange('formality_level', level);
              }}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Casual</span>
              <span>Balanced</span>
              <span>Formal</span>
              <span>Academic</span>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'advanced' && (
        <div className="space-y-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <h3 className="text-md font-semibold">Temperature</h3>
                <button 
                  className="ml-2 text-gray-400 hover:text-white"
                  onClick={() => toggleTooltip('temperature')}
                >
                  <FaInfoCircle />
                </button>
              </div>
              <div className="text-sm font-medium">{parameters.temperature.toFixed(2)}</div>
            </div>
            
            {tooltips.temperature && (
              <div className="bg-gray-800 p-2 rounded text-sm mb-2">
                {getParameterDescription('temperature')}
              </div>
            )}
            
            <input 
              type="range" 
              min="0" 
              max="2" 
              step="0.01"
              value={parameters.temperature
(Content truncated due to size limit. Use line ranges to read in chunks)