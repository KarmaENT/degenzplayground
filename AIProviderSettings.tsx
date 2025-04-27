import React, { useState, useEffect } from 'react';
import { FaRobot, FaKey, FaExclamationTriangle, FaCheck, FaCog } from 'react-icons/fa';

const AIProviderSettings = () => {
  const [providers, setProviders] = useState({});
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [apiKeys, setApiKeys] = useState({});
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [validationStatus, setValidationStatus] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch available providers on component mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, this would be an API call
        // const response = await fetch('/api/ai-providers');
        // const data = await response.json();
        
        // Mock data for demonstration
        const data = {
          "gemini": {
            "name": "Gemini Flash 2.0",
            "description": "Google's advanced AI model with strong reasoning capabilities",
            "requires_api_key": true,
            "env_var": "GEMINI_API_KEY",
            "default": true
          },
          "openrouter": {
            "name": "OpenRouter",
            "description": "Gateway to multiple AI models including Claude, GPT-4, and more",
            "requires_api_key": true,
            "env_var": "OPENROUTER_API_KEY",
            "default": false
          },
          "grok": {
            "name": "Grok",
            "description": "xAI's conversational AI with real-time knowledge",
            "requires_api_key": true,
            "env_var": "GROK_API_KEY",
            "default": false
          },
          "deepseek": {
            "name": "DeepSeek",
            "description": "Advanced AI models with strong coding and reasoning capabilities",
            "requires_api_key": true,
            "env_var": "DEEPSEEK_API_KEY",
            "default": false
          },
          "perplexity": {
            "name": "Perplexity",
            "description": "AI with online search capabilities for up-to-date information",
            "requires_api_key": true,
            "env_var": "PERPLEXITY_API_KEY",
            "default": false
          },
          "huggingface": {
            "name": "Hugging Face",
            "description": "Access to thousands of open-source AI models",
            "requires_api_key": true,
            "env_var": "HUGGINGFACE_API_KEY",
            "default": false
          },
          "mistral": {
            "name": "Mistral AI",
            "description": "Efficient and powerful AI models with strong reasoning",
            "requires_api_key": true,
            "env_var": "MISTRAL_API_KEY",
            "default": false
          }
        };
        
        setProviders(data);
        
        // Load saved API keys from localStorage
        const savedKeys = JSON.parse(localStorage.getItem('aiProviderApiKeys') || '{}');
        setApiKeys(savedKeys);
        
        // Load validation status from localStorage
        const savedValidation = JSON.parse(localStorage.getItem('aiProviderValidation') || '{}');
        setValidationStatus(savedValidation);
        
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load AI providers');
        setIsLoading(false);
      }
    };
    
    fetchProviders();
  }, []);

  // Fetch models when provider changes
  useEffect(() => {
    const fetchModels = async () => {
      if (!selectedProvider) return;
      
      try {
        // In a real implementation, this would be an API call
        // const response = await fetch(`/api/ai-providers/${selectedProvider}/models?api_key=${apiKeys[selectedProvider] || ''}`);
        // const data = await response.json();
        
        // Mock data for demonstration
        let mockModels = [];
        
        switch(selectedProvider) {
          case 'gemini':
            mockModels = [
              {"id": "gemini-flash-2.0", "name": "Gemini Flash 2.0"},
              {"id": "gemini-pro", "name": "Gemini Pro"},
              {"id": "gemini-ultra", "name": "Gemini Ultra"}
            ];
            break;
          case 'openrouter':
            mockModels = [
              {"id": "anthropic/claude-3-opus", "name": "Claude 3 Opus"},
              {"id": "anthropic/claude-3-sonnet", "name": "Claude 3 Sonnet"},
              {"id": "anthropic/claude-3-haiku", "name": "Claude 3 Haiku"},
              {"id": "openai/gpt-4o", "name": "GPT-4o"},
              {"id": "openai/gpt-4-turbo", "name": "GPT-4 Turbo"},
              {"id": "meta-llama/llama-3-70b-instruct", "name": "Llama 3 70B"}
            ];
            break;
          case 'grok':
            mockModels = [
              {"id": "grok-2", "name": "Grok-2"},
              {"id": "grok-1.5", "name": "Grok-1.5"}
            ];
            break;
          case 'deepseek':
            mockModels = [
              {"id": "deepseek-chat", "name": "DeepSeek Chat"},
              {"id": "deepseek-coder", "name": "DeepSeek Coder"}
            ];
            break;
          case 'perplexity':
            mockModels = [
              {"id": "sonar-medium-online", "name": "Sonar Medium (Online)"},
              {"id": "sonar-small-online", "name": "Sonar Small (Online)"},
              {"id": "sonar-medium-chat", "name": "Sonar Medium Chat"},
              {"id": "sonar-small-chat", "name": "Sonar Small Chat"}
            ];
            break;
          case 'huggingface':
            mockModels = [
              {"id": "mistralai/Mixtral-8x7B-Instruct-v0.1", "name": "Mixtral 8x7B"},
              {"id": "meta-llama/Llama-2-70b-chat-hf", "name": "Llama 2 70B"},
              {"id": "tiiuae/falcon-180B-chat", "name": "Falcon 180B"},
              {"id": "bigscience/bloom", "name": "BLOOM 176B"},
              {"id": "google/flan-t5-xxl", "name": "Flan-T5 XXL"}
            ];
            break;
          case 'mistral':
            mockModels = [
              {"id": "mistral-large-latest", "name": "Mistral Large"},
              {"id": "mistral-medium-latest", "name": "Mistral Medium"},
              {"id": "mistral-small-latest", "name": "Mistral Small"},
              {"id": "open-mistral-7b", "name": "Open Mistral 7B"}
            ];
            break;
          default:
            mockModels = [];
        }
        
        setModels(mockModels);
        
        // Set default model if available
        if (mockModels.length > 0) {
          // Try to load saved model preference
          const savedModelPreferences = JSON.parse(localStorage.getItem('aiProviderModelPreferences') || '{}');
          const savedModel = savedModelPreferences[selectedProvider];
          
          if (savedModel && mockModels.some(model => model.id === savedModel)) {
            setSelectedModel(savedModel);
          } else {
            setSelectedModel(mockModels[0].id);
          }
        } else {
          setSelectedModel('');
        }
        
      } catch (err) {
        setError(`Failed to load models for ${selectedProvider}`);
      }
    };
    
    fetchModels();
  }, [selectedProvider, apiKeys]);

  // Handle API key change
  const handleApiKeyChange = (provider, value) => {
    const newApiKeys = { ...apiKeys, [provider]: value };
    setApiKeys(newApiKeys);
    
    // Save to localStorage
    localStorage.setItem('aiProviderApiKeys', JSON.stringify(newApiKeys));
    
    // Clear validation status for this provider
    const newValidationStatus = { ...validationStatus };
    delete newValidationStatus[provider];
    setValidationStatus(newValidationStatus);
    localStorage.setItem('aiProviderValidation', JSON.stringify(newValidationStatus));
  };

  // Handle model selection
  const handleModelChange = (provider, modelId) => {
    setSelectedModel(modelId);
    
    // Save model preference
    const savedModelPreferences = JSON.parse(localStorage.getItem('aiProviderModelPreferences') || '{}');
    const newModelPreferences = { ...savedModelPreferences, [provider]: modelId };
    localStorage.setItem('aiProviderModelPreferences', JSON.stringify(newModelPreferences));
  };

  // Validate API key
  const validateApiKey = async (provider) => {
    if (!apiKeys[provider]) return;
    
    setIsValidating(true);
    
    try {
      // In a real implementation, this would be an API call
      // const response = await fetch('/api/ai-providers/validate-key', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ provider, api_key: apiKeys[provider] })
      // });
      // const data = await response.json();
      
      // Mock validation (always succeeds if key is not empty)
      const isValid = apiKeys[provider].trim().length > 0;
      
      // Update validation status
      const newValidationStatus = { 
        ...validationStatus, 
        [provider]: { valid: isValid, timestamp: Date.now() } 
      };
      
      setValidationStatus(newValidationStatus);
      
      // Save to localStorage
      localStorage.setItem('aiProviderValidation', JSON.stringify(newValidationStatus));
      
    } catch (err) {
      setError(`Failed to validate API key for ${provider}`);
    } finally {
      setIsValidating(false);
    }
  };

  // Set as default provider
  const setAsDefault = (provider) => {
    localStorage.setItem('defaultAiProvider', provider);
    
    // Update UI to show this is now the default
    const newProviders = { ...providers };
    Object.keys(newProviders).forEach(key => {
      newProviders[key].default = (key === provider);
    });
    
    setProviders(newProviders);
  };

  if (isLoading) {
    return <div className="loading-spinner">Loading AI provider settings...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="ai-provider-settings">
      <h2 className="settings-section-title">AI Provider Settings</h2>
      <p className="settings-section-description">
        Configure AI providers for your agents. Each provider requires an API key.
      </p>
      
      <div className="provider-selector">
        <label htmlFor="provider-select">Select AI Provider:</label>
        <select 
          id="provider-select"
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="form-select"
        >
          {Object.entries(providers).map(([id, provider]) => (
            <option key={id} value={id}>
              {provider.name} {provider.default ? '(Default)' : ''}
            </option>
          ))}
        </select>
      </div>
      
      {selectedProvider && providers[selectedProvider] && (
        <div className="provider-details">
          <div className="provider-header">
            <div className="provider-icon">
              <FaRobot size={24} />
            </div>
            <div className="provider-title">
              <h3>{providers[selectedProvider].name}</h3>
              <p>{providers[selectedProvider].description}</p>
            </div>
          </div>
          
          <div className="api-key-section">
            <div className="input-group">
              <label htmlFor={`${selectedProvider}-api-key`}>
                <FaKey /> API Key:
              </label>
              <input
                id={`${selectedProvider}-api-key`}
                type="password"
                value={apiKeys[selectedProvider] || ''}
                onChange={(e) => handleApiKeyChange(selectedProvider, e.target.value)}
                placeholder={`Enter your ${providers[selectedProvider].name} API key`}
                className="form-input"
              />
              <button 
                onClick={() => validateApiKey(selectedProvider)}
                disabled={isValidating || !apiKeys[selectedProvider]}
                className="btn btn-secondary"
              >
                {isValidating ? 'Validating...' : 'Validate Key'}
              </button>
            </div>
            
            {validationStatus[selectedProvider] && (
              <div className={`validation-status ${validationStatus[selectedProvider].valid ? 'valid' : 'invalid'}`}>
                {validationStatus[selectedProvider].valid ? (
                  <><FaCheck /> API key is valid</>
                ) : (
                  <><FaExclamationTriangle /> API key is invalid</>
                )}
              </div>
            )}
          </div>
          
          <div className="model-selection">
            <label htmlFor="model-select">Select Model:</label>
            <select 
              id="model-select"
              value={selectedModel}
              onChange={(e) => handleModelChange(selectedProvider, e.target.value)}
              className="form-select"
              disabled={models.length === 0}
            >
              {models.length === 0 ? (
                <option value="">No models available</option>
              ) : (
                models.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className="provider-actions">
            <button 
              onClick={() => setAsDefault(selectedProvider)}
              disabled={providers[selectedProvider].default}
              className="btn btn-primary"
            >
              <FaCog /> Set as Default Provider
            </button>
          </div>
          
          <div className="provider-info">
            <h4>How to get an API key:</h4>
            <ol>
              {selectedProvider === 'gemini' && (
                <>
                  <li>Visit <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer">Google AI Studio</a></li>
                  <li>Sign in with your Google account</li>
                  <li>Go to "API keys" in the left sidebar</li>
                  <li>Click "Create API Key" and copy the generated key</li>
                </>
              )}
              {selectedProvider === 'openrouter' && (
                <>
                  <li>Visit <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer">OpenRouter</a></li>
                  <li>Sign up or log in to your account</li>
                  <li>Go to the API Keys section</li>
                  <li>Create a new API key and copy it</li>
                </>
              )}
              {selectedProvider === 'grok' && (
                <>
                  <li>Visit <a href="https://grok.x.ai/" target="_blank" rel="noopener noreferrer">Grok AI</a></li>
                  <li>Sign up for a Grok account</li>
                  <li>Navigate to the API section</li>
                  <li>Generate a new API key and copy it</li>
                </>
              )}
              {selectedProvider === 'deepseek' && (
                <>
                  <li>Visit <a href="https://deepseek.ai/" target="_blank" rel="noopener noreferrer">DeepSeek AI</a></li>
                  <li>Create an account or sign in</li>
                  <li>Go to your account settings</li>
                  <li>Find the API section and generate a new key</li>
                </>
              )}
              {selectedProvider === 'perplexity' && (
                <>
                  <li>Visit <a href="https://www.perplexity.ai/" target="_blank" rel="noopener noreferrer">Perplexity AI</a></li>
                  <li>Sign up for an account</li>
                  <li>Go to your account settings</li>
                  <li>Navigate to the API section and create a new API key</li>
                </>
              )}
             
(Content truncated due to size limit. Use line ranges to read in chunks)