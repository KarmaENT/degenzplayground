import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaLightbulb, FaCheck, FaTimes, FaArrowRight, FaInfoCircle } from 'react-icons/fa';

interface ImprovementSuggestion {
  id: number;
  agent_id: number;
  suggestion_type: string;
  suggestion_content: string;
  confidence_score: number;
  supporting_evidence: Record<string, any>;
  is_implemented: boolean;
  created_at: string;
  implemented_at: string | null;
}

interface AgentImprovementSuggestionsProps {
  agentId: number;
  agentName: string;
  onSuggestionImplemented?: () => void;
}

const AgentImprovementSuggestions: React.FC<AgentImprovementSuggestionsProps> = ({ 
  agentId, 
  agentName,
  onSuggestionImplemented 
}) => {
  const [suggestions, setSuggestions] = useState<ImprovementSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [implementing, setImplementing] = useState<Record<number, boolean>>({});
  const [expandedEvidence, setExpandedEvidence] = useState<Record<number, boolean>>({});
  const [filterImplemented, setFilterImplemented] = useState<boolean>(false);

  useEffect(() => {
    fetchSuggestions();
  }, [agentId, filterImplemented]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/suggestions/?agent_id=${agentId}&is_implemented=${filterImplemented ? 'true' : 'false'}`);
      setSuggestions(response.data);
    } catch (err) {
      setError('Failed to load improvement suggestions');
      console.error('Error fetching suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const response = await axios.post('/api/suggestions/generate', {
        agent_id: agentId
      });
      
      // Merge new suggestions with existing ones
      const newSuggestions = response.data;
      setSuggestions(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const filteredNew = newSuggestions.filter(s => !existingIds.has(s.id));
        return [...prev, ...filteredNew];
      });
      
    } catch (err) {
      setError('Failed to generate suggestions. Please try again.');
      console.error('Error generating suggestions:', err);
    } finally {
      setGenerating(false);
    }
  };

  const implementSuggestion = async (suggestionId: number) => {
    try {
      setImplementing(prev => ({ ...prev, [suggestionId]: true }));
      
      await axios.put(`/api/suggestions/${suggestionId}/implement`);
      
      // Update the suggestion in the list
      setSuggestions(prev => 
        prev.map(s => 
          s.id === suggestionId 
            ? { ...s, is_implemented: true, implemented_at: new Date().toISOString() } 
            : s
        )
      );
      
      if (onSuggestionImplemented) {
        onSuggestionImplemented();
      }
      
    } catch (err) {
      setError('Failed to implement suggestion. Please try again.');
      console.error('Error implementing suggestion:', err);
    } finally {
      setImplementing(prev => ({ ...prev, [suggestionId]: false }));
    }
  };

  const toggleEvidence = (suggestionId: number) => {
    setExpandedEvidence(prev => ({
      ...prev,
      [suggestionId]: !prev[suggestionId]
    }));
  };

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'instruction_update':
        return 'System Instructions';
      case 'personality_adjustment':
        return 'Personality';
      case 'example_addition':
        return 'Examples';
      case 'system_instructions':
        return 'System Setup';
      default:
        return type.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  const getSuggestionTypeColor = (type: string) => {
    switch (type) {
      case 'instruction_update':
        return 'bg-blue-600';
      case 'personality_adjustment':
        return 'bg-purple-600';
      case 'example_addition':
        return 'bg-green-600';
      case 'system_instructions':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading improvement suggestions...</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <FaLightbulb className="mr-2 text-yellow-400" />
          {agentName} Improvement Suggestions
        </h2>
        <div className="flex space-x-2">
          <button 
            className={`px-3 py-1 rounded text-sm font-medium ${!filterImplemented ? 'bg-blue-600' : 'bg-gray-700'}`}
            onClick={() => setFilterImplemented(false)}
          >
            Pending
          </button>
          <button 
            className={`px-3 py-1 rounded text-sm font-medium ${filterImplemented ? 'bg-blue-600' : 'bg-gray-700'}`}
            onClick={() => setFilterImplemented(true)}
          >
            Implemented
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900 text-white p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      
      {suggestions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">
            {filterImplemented 
              ? "No implemented suggestions found." 
              : "No improvement suggestions available yet."}
          </p>
          {!filterImplemented && (
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
              onClick={generateSuggestions}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate Suggestions'}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-4">
            {suggestions.map(suggestion => (
              <div key={suggestion.id} className="bg-gray-700 rounded-lg overflow-hidden">
                <div className="flex items-center p-3 border-b border-gray-600">
                  <div className={`${getSuggestionTypeColor(suggestion.suggestion_type)} rounded-full w-3 h-3 mr-2`}></div>
                  <div className="text-sm font-medium text-gray-300">
                    {getSuggestionTypeLabel(suggestion.suggestion_type)}
                  </div>
                  <div className="ml-auto flex items-center space-x-2">
                    <div className="text-xs px-2 py-1 rounded bg-gray-600">
                      {(suggestion.confidence_score * 100).toFixed(0)}% confidence
                    </div>
                    {suggestion.is_implemented && (
                      <div className="text-xs px-2 py-1 rounded bg-green-700 flex items-center">
                        <FaCheck className="mr-1" /> Implemented
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4">
                  <p className="text-white mb-3">{suggestion.suggestion_content}</p>
                  
                  <div className="flex justify-between items-center">
                    <button
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
                      onClick={() => toggleEvidence(suggestion.id)}
                    >
                      <FaInfoCircle className="mr-1" />
                      {expandedEvidence[suggestion.id] ? 'Hide Evidence' : 'Show Evidence'}
                    </button>
                    
                    <div className="text-xs text-gray-400">
                      {new Date(suggestion.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {expandedEvidence[suggestion.id] && (
                    <div className="mt-3 p-3 bg-gray-800 rounded text-sm">
                      <h4 className="font-medium mb-2">Supporting Evidence:</h4>
                      <ul className="space-y-1 text-gray-300">
                        {Object.entries(suggestion.supporting_evidence).map(([key, value]) => (
                          <li key={key} className="flex">
                            <span className="text-gray-400 mr-2">{key.replace(/_/g, ' ')}:</span>
                            <span>
                              {typeof value === 'object' 
                                ? JSON.stringify(value) 
                                : typeof value === 'number' && key.includes('rating')
                                  ? value.toFixed(1)
                                  : String(value)
                              }
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {!suggestion.is_implemented && (
                    <div className="mt-3 flex justify-end">
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-1 px-3 rounded flex items-center"
                        onClick={() => implementSuggestion(suggestion.id)}
                        disabled={implementing[suggestion.id]}
                      >
                        {implementing[suggestion.id] ? 'Implementing...' : 'Implement'} <FaArrowRight className="ml-1" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {!filterImplemented && (
            <div className="flex justify-center">
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                onClick={generateSuggestions}
                disabled={generating}
              >
                {generating ? 'Generating...' : 'Generate More Suggestions'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AgentImprovementSuggestions;
