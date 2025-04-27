import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

interface WorkflowSession {
  id: number;
  workflow_id: number;
  session_id: number;
  status: string;
  current_step: number;
  results: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface Workflow {
  id: number;
  name: string;
  description: string;
  steps: WorkflowStep[];
  is_public: boolean;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

interface WorkflowStep {
  name: string;
  description: string;
  agent_role?: string;
  agent_id?: number;
  instructions: string;
  depends_on: number[];
  expected_output?: string;
}

interface Agent {
  id: number;
  name: string;
  role: string;
}

const WorkflowRunner: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null);
  const [workflowSessions, setWorkflowSessions] = useState<WorkflowSession[]>([]);
  const [activeSession, setActiveSession] = useState<WorkflowSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [autoExecute, setAutoExecute] = useState(false);

  // Fetch available workflows
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await axios.get('/api/workflows/');
        setWorkflows(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load workflows');
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, []);

  // Fetch workflow sessions for this sandbox session
  useEffect(() => {
    const fetchWorkflowSessions = async () => {
      if (!sessionId) return;
      
      try {
        const response = await axios.get(`/api/workflows/sessions/${sessionId}`);
        setWorkflowSessions(response.data);
        
        // If there's an active session, set it
        const inProgress = response.data.find((ws: WorkflowSession) => ws.status === 'in_progress');
        if (inProgress) {
          setActiveSession(inProgress);
        }
      } catch (err) {
        setError('Failed to load workflow sessions');
      }
    };

    fetchWorkflowSessions();
  }, [sessionId]);

  // Auto-execute next step if enabled
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (autoExecute && activeSession && activeSession.status === 'in_progress' && !executing) {
      timeoutId = setTimeout(() => {
        executeNextStep();
      }, 3000); // Wait 3 seconds between steps
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [autoExecute, activeSession, executing]);

  const startWorkflow = async () => {
    if (!selectedWorkflow) {
      setError('Please select a workflow');
      return;
    }

    try {
      const response = await axios.post('/api/workflows/sessions/', {
        workflow_id: selectedWorkflow,
        session_id: parseInt(sessionId || '0'),
        status: 'pending',
        current_step: 0,
        results: {}
      });
      
      setActiveSession(response.data);
      setWorkflowSessions([...workflowSessions, response.data]);
      setSuccessMessage('Workflow started successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to start workflow');
    }
  };

  const executeNextStep = async () => {
    if (!activeSession) {
      setError('No active workflow session');
      return;
    }

    setExecuting(true);
    try {
      const response = await axios.post(`/api/workflows/execute/${activeSession.id}`);
      
      // Update the active session
      const updatedSession = {
        ...activeSession,
        status: response.data.status,
        current_step: response.data.current_step,
        results: { ...activeSession.results, [response.data.current_step - 1]: response.data.step_result }
      };
      
      setActiveSession(updatedSession);
      
      // Update the session in the list
      setWorkflowSessions(workflowSessions.map(ws => 
        ws.id === activeSession.id ? updatedSession : ws
      ));
      
      setSuccessMessage(`Step ${response.data.current_step - 1} executed successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(`Failed to execute step: ${err.response?.data?.detail || err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const getWorkflowById = (id: number): Workflow | undefined => {
    return workflows.find(w => w.id === id);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getStepStatus = (stepIndex: number): 'pending' | 'completed' | 'current' | 'blocked' => {
    if (!activeSession) return 'pending';
    
    if (stepIndex < activeSession.current_step) {
      return 'completed';
    } else if (stepIndex === activeSession.current_step) {
      return 'current';
    } else {
      // Check if dependencies are satisfied
      const workflow = getWorkflowById(activeSession.workflow_id);
      if (!workflow) return 'blocked';
      
      const step = workflow.steps[stepIndex];
      const dependsOn = step.depends_on || [];
      
      // If any dependency is not completed, the step is blocked
      for (const depIndex of dependsOn) {
        if (!activeSession.results[depIndex]) {
          return 'blocked';
        }
      }
      
      return 'pending';
    }
  };

  if (loading) {
    return <div className="p-4">Loading workflows...</div>;
  }

  return (
    <div className="bg-gray-800 text-white rounded-lg shadow-lg p-4 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">Workflow Runner</h2>
      
      {error && (
        <div className="bg-red-600 text-white p-2 mb-4 rounded">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-600 text-white p-2 mb-4 rounded">
          {successMessage}
        </div>
      )}
      
      {!activeSession ? (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Start New Workflow</h3>
          
          <div className="mb-4">
            <label className="block mb-2">Select Workflow</label>
            <select 
              className="w-full bg-gray-700 text-white p-2 rounded"
              value={selectedWorkflow || ''}
              onChange={(e) => setSelectedWorkflow(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Select a workflow</option>
              {workflows.map(workflow => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name} {workflow.is_public && '(Public)'}
                </option>
              ))}
            </select>
          </div>
          
          {selectedWorkflow && (
            <div className="mb-4 bg-gray-700 p-3 rounded">
              <h4 className="font-semibold">{getWorkflowById(selectedWorkflow)?.name}</h4>
              <p className="text-gray-300 text-sm mb-2">{getWorkflowById(selectedWorkflow)?.description}</p>
              <div className="text-xs text-gray-400">
                {getWorkflowById(selectedWorkflow)?.steps.length} steps
              </div>
            </div>
          )}
          
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={startWorkflow}
            disabled={!selectedWorkflow}
          >
            Start Workflow
          </button>
        </div>
      ) : (
        <div className="flex-grow flex flex-col">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Active Workflow: {getWorkflowById(activeSession.workflow_id)?.name}
            </h3>
            <div className="flex items-center">
              <span className={`px-2 py-1 rounded text-xs mr-2 ${
                activeSession.status === 'pending' ? 'bg-yellow-600' :
                activeSession.status === 'in_progress' ? 'bg-blue-600' :
                activeSession.status === 'completed' ? 'bg-green-600' : 'bg-red-600'
              }`}>
                {activeSession.status.toUpperCase()}
              </span>
              <span className="text-xs text-gray-400">
                Step {activeSession.current_step} of {getWorkflowById(activeSession.workflow_id)?.steps.length}
              </span>
            </div>
          </div>
          
          <div className="mb-4 flex items-center">
            <input 
              type="checkbox" 
              id="autoExecute" 
              checked={autoExecute} 
              onChange={() => setAutoExecute(!autoExecute)}
              className="mr-2"
              disabled={activeSession.status !== 'in_progress'}
            />
            <label htmlFor="autoExecute">Auto-execute steps</label>
          </div>
          
          <div className="flex-grow overflow-y-auto bg-gray-900 rounded p-4 mb-4">
            <h4 className="font-semibold mb-2">Workflow Steps</h4>
            
            {getWorkflowById(activeSession.workflow_id)?.steps.map((step, index) => {
              const status = getStepStatus(index);
              const result = activeSession.results[index];
              
              return (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg mb-3 ${
                    status === 'completed' ? 'bg-green-900' :
                    status === 'current' ? 'bg-blue-900' :
                    status === 'blocked' ? 'bg-red-900' : 'bg-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="font-bold">{index + 1}. {step.name}</span>
                      {step.agent_id && (
                        <span className="ml-2 bg-purple-700 text-white text-xs px-2 py-1 rounded">
                          Agent Required
                        </span>
                      )}
                      {step.agent_role && (
                        <span className="ml-2 bg-indigo-700 text-white text-xs px-2 py-1 rounded">
                          Role: {step.agent_role}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {status.toUpperCase()}
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-1">{step.description}</p>
                  
                  {step.depends_on.length > 0 && (
                    <div className="text-xs text-gray-400 mb-1">
                      Depends on steps: {step.depends_on.map(d => d + 1).join(', ')}
                    </div>
                  )}
                  
                  {result && (
                    <div className="mt-2 border-t border-gray-700 pt-2">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm font-semibold">Result from {result.agent_name}</div>
                        <div className="text-xs text-gray-400">{formatTimestamp(result.timestamp)}</div>
                      </div>
                      <div className="text-sm bg-gray-800 p-2 rounded whitespace-pre-wrap">
                        {result.content}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {activeSession.status === 'in_progress' && (
            <button 
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={executeNextStep}
              disabled={executing}
            >
              {executing ? 'Executing...' : 'Execute Next Step'}
            </button>
          )}
          
          {activeSession.status === 'completed' && (
            <div className="bg-green-900 p-3 rounded text-center">
              <h4 className="font-semibold">Workflow Completed Successfully</h4>
              <p className="text-sm">All steps have been executed</p>
            </div>
          )}
          
          {activeSession.status === 'failed' && (
            <div className="bg-red-900 p-3 rounded text-center">
              <h4 className="font-semibold">Workflow Failed</h4>
              <p className="text-sm">An error occurred during execution</p>
            </div>
          )}
        </div>
      )}
      
      {workflowSessions.length > 0 && !activeSession && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Previous Workflow Sessions</h3>
          
          <div className="space-y-3">
            {workflowSessions.map(session => {
              const workflow = getWorkflowById(session.workflow_id);
              
              return (
                <div key={session.id} className="bg-gray-700 p-3 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="font-bold">{workflow?.name || 'Unknown Workflow'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded text-xs mr-2 ${
                        session.status === 'pending' ? 'bg-yellow-600' :
                        session.status === 'in_progress' ? 'bg-blue-600' :
                        session.status === 'completed' ? 'bg-green-600' : 'bg-red-600'
                      }`}>
                        {session.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(session.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-300">
                    Progress: {session.current_step} / {workflow?.steps.length || '?'} steps
                  </div>
                  
                  <button 
                    className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                    onClick={() => setActiveSession(session)}
                  >
                    Resume Session
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowRunner;
