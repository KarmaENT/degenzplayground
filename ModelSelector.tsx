import React, { useState, useEffect } from 'react';
import { FaRobot, FaCog, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import AIProviderSettings from '../settings/AIProviderSettings';

interface ModelSelectorProps {
  onModelChange: (provider: string, model: string) => void;
  currentProvider?: string;
  currentModel?: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  onModelChange, 
  currentProvider = 'gemini', 
  currentModel = 'gemini-flash-2.0' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(currentProvider);
  const [selectedModel, setSelectedModel] = useState(currentModel);
  const [showSettings, setShowSettings] = useState(false);
  
  useEffect(() => {
    setSelectedProvider(currentProvider);
    setSelectedModel(currentModel);
  }, [currentProvider, currentModel]);

  const providers = [
    { id: 'gemini', name: 'Gemini', models: [
      { id: 'gemini-flash-2.0', name: 'Gemini Flash 2.0' },
      { id: 'gemini-pro', name: 'Gemini Pro' },
      { id: 'gemini-ultra', name: 'Gemini Ultra' },
    ]},
    { id: 'openai', name: 'OpenAI', models: [
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ]},
    { id: 'openrouter', name: 'OpenRouter', models: [
      { id: 'openai/gpt-3.5-turbo', name: 'OpenAI GPT-3.5 Turbo' },
      { id: 'openai/gpt-4', name: 'OpenAI GPT-4' },
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
      { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet' },
      { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B' },
    ]},
    { id: 'grok', name: 'Grok', models: [
      { id: 'grok-1', name: 'Grok-1' },
    ]},
    { id: 'deepseek', name: 'DeepSeek', models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder' },
    ]},
    { id: 'perplexity', name: 'Perplexity', models: [
      { id: 'pplx-7b-online', name: 'Perplexity 7B' },
      { id: 'pplx-70b-online', name: 'Perplexity 70B' },
    ]},
    { id: 'huggingface', name: 'Hugging Face', models: [
      { id: 'meta-llama/Llama-2-70b-chat-hf', name: 'Llama 2 70B' },
      { id: 'mistralai/Mistral-7B-Instruct-v0.2', name: 'Mistral 7B' },
      { id: 'google/gemma-7b-it', name: 'Gemma 7B' },
    ]},
    { id: 'mistral', name: 'Mistral', models: [
      { id: 'mistral-tiny', name: 'Mistral Tiny' },
      { id: 'mistral-small', name: 'Mistral Small' },
      { id: 'mistral-medium', name: 'Mistral Medium' },
      { id: 'mistral-large', name: 'Mistral Large' },
    ]},
  ];

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    // Select the first model of the provider by default
    const provider = providers.find(p => p.id === providerId);
    if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0].id);
      onModelChange(providerId, provider.models[0].id);
    }
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    onModelChange(selectedProvider, modelId);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const toggleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSettings(!showSettings);
  };

  const handleSettingsSave = (settings: any) => {
    // In a real app, this would save to backend/localStorage
    console.log('Saving settings:', settings);
    setShowSettings(false);
  };

  const selectedProviderObj = providers.find(p => p.id === selectedProvider);
  const selectedModelObj = selectedProviderObj?.models.find(m => m.id === selectedModel);

  return (
    <div className="model-selector-container">
      <div className="model-selector" onClick={toggleDropdown}>
        <div className="selected-model">
          <FaRobot className="model-icon" />
          <div className="model-info">
            <span className="provider-name">{selectedProviderObj?.name}</span>
            <span className="model-name">{selectedModelObj?.name}</span>
          </div>
        </div>
        <div className="model-actions">
          <button className="settings-button" onClick={toggleSettings}>
            <FaCog />
          </button>
          {isOpen ? <FaChevronUp /> : <FaChevronDown />}
        </div>
      </div>
      
      {isOpen && (
        <div className="model-dropdown">
          <div className="providers-list">
            {providers.map(provider => (
              <div 
                key={provider.id}
                className={`provider-item ${selectedProvider === provider.id ? 'active' : ''}`}
                onClick={() => handleProviderSelect(provider.id)}
              >
                {provider.name}
              </div>
            ))}
          </div>
          <div className="models-list">
            {selectedProviderObj?.models.map(model => (
              <div 
                key={model.id}
                className={`model-item ${selectedModel === model.id ? 'active' : ''}`}
                onClick={() => handleModelSelect(model.id)}
              >
                {model.name}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showSettings && (
        <div className="settings-modal">
          <div className="settings-modal-content">
            <div className="settings-modal-header">
              <h3>AI Provider Settings</h3>
              <button className="close-button" onClick={toggleSettings}>×</button>
            </div>
            <div className="settings-modal-body">
              <AIProviderSettings 
                savedSettings={{
                  apiKeys: {},
                  defaultModels: {
                    [selectedProvider]: selectedModel
                  },
                  activeProvider: selectedProvider
                }}
                onSave={handleSettingsSave}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
