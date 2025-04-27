import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './styles/App.css';

// Import components (to be created)
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'persona'>('sandbox');

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-container">
        <header className="app-header">
          <h1>DeGeNz Lounge</h1>
          <div className="tab-selector">
            <button 
              className={activeTab === 'sandbox' ? 'active' : ''} 
              onClick={() => setActiveTab('sandbox')}
            >
              Sandbox Mode
            </button>
            <button 
              className={activeTab === 'persona' ? 'active' : ''} 
              onClick={() => setActiveTab('persona')}
            >
              Persona Mode
            </button>
          </div>
        </header>
        
        <main className="app-content">
          {activeTab === 'sandbox' ? (
            <div className="sandbox-layout">
              <div className="agent-library">
                <h2>Agent Library</h2>
                {/* AgentLibrary component will go here */}
              </div>
              
              <div className="sandbox-workspace">
                <h2>Sandbox Workspace</h2>
                {/* SandboxWorkspace component will go here */}
              </div>
              
              <div className="agent-settings">
                <h2>Agent Settings</h2>
                {/* AgentSettings component will go here */}
              </div>
            </div>
          ) : (
            <div className="persona-mode">
              <h2>Persona Mode</h2>
              {/* PersonaMode component will go here */}
            </div>
          )}
        </main>
      </div>
    </DndProvider>
  );
};

export default App;
