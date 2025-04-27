import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

interface AgentRole {
  id: number;
  name: string;
  description: string;
  permissions: any;
  role_type: string;
  created_at: string;
}

interface Team {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  is_public: boolean;
  hierarchy_structure: any;
  created_at: string;
  updated_at: string;
  members: Agent[];
  available_roles: AgentRole[];
}

interface Agent {
  id: number;
  name: string;
  role: string;
}

interface AgentRoleAssignment {
  id: number;
  team_id: number;
  agent_id: number;
  role_id: number;
  assigned_by: number;
  created_at: string;
}

const TeamManager: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [roles, setRoles] = useState<AgentRole[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [roleAssignments, setRoleAssignments] = useState<AgentRoleAssignment[]>([]);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    is_public: false,
    hierarchy_structure: {
      levels: [
        {
          name: 'Leadership',
          roles: ['leader']
        },
        {
          name: 'Specialists',
          roles: ['specialist']
        },
        {
          name: 'Members',
          roles: ['member']
        }
      ]
    }
  });
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: {},
    role_type: 'member'
  });
  const [selectedAgents, setSelectedAgents] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get('/api/hierarchy/teams/');
        setTeams(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load teams');
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get('/api/hierarchy/roles/');
        setRoles(response.data);
      } catch (err) {
        setError('Failed to load roles');
      }
    };

    fetchRoles();
  }, []);

  // Fetch agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await axios.get('/api/agents/');
        setAgents(response.data);
      } catch (err) {
        setError('Failed to load agents');
      }
    };

    fetchAgents();
  }, []);

  // Fetch role assignments when a team is selected
  useEffect(() => {
    const fetchRoleAssignments = async () => {
      if (!selectedTeam) return;
      
      try {
        // This endpoint would need to be implemented in the backend
        const response = await axios.get(`/api/hierarchy/teams/${selectedTeam.id}/role-assignments`);
        setRoleAssignments(response.data);
      } catch (err) {
        setError('Failed to load role assignments');
      }
    };

    fetchRoleAssignments();
  }, [selectedTeam]);

  const handleCreateTeam = async () => {
    try {
      const response = await axios.post('/api/hierarchy/teams/', {
        ...newTeam,
        agent_ids: selectedAgents,
        role_ids: selectedRoles
      });
      
      setTeams([...teams, response.data]);
      setSelectedTeam(response.data);
      
      // Reset form
      setNewTeam({
        name: '',
        description: '',
        is_public: false,
        hierarchy_structure: {
          levels: [
            {
              name: 'Leadership',
              roles: ['leader']
            },
            {
              name: 'Specialists',
              roles: ['specialist']
            },
            {
              name: 'Members',
              roles: ['member']
            }
          ]
        }
      });
      setSelectedAgents([]);
      setSelectedRoles([]);
      
      setSuccessMessage('Team created successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to create team');
    }
  };

  const handleCreateRole = async () => {
    try {
      const response = await axios.post('/api/hierarchy/roles/', newRole);
      
      setRoles([...roles, response.data]);
      
      // Reset form
      setNewRole({
        name: '',
        description: '',
        permissions: {},
        role_type: 'member'
      });
      
      setSuccessMessage('Role created successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to create role');
    }
  };

  const handleAssignRole = async (agentId: number, roleId: number) => {
    if (!selectedTeam) return;
    
    try {
      const response = await axios.post(`/api/hierarchy/teams/${selectedTeam.id}/assign-role`, {
        agent_id: agentId,
        role_id: roleId
      });
      
      setRoleAssignments([...roleAssignments, response.data]);
      
      setSuccessMessage('Role assigned successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to assign role');
    }
  };

  const handleRemoveRoleAssignment = async (assignmentId: number) => {
    if (!selectedTeam) return;
    
    try {
      await axios.delete(`/api/hierarchy/teams/${selectedTeam.id}/remove-role/${assignmentId}`);
      
      setRoleAssignments(roleAssignments.filter(ra => ra.id !== assignmentId));
      
      setSuccessMessage('Role assignment removed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to remove role assignment');
    }
  };

  const handleCreateTeamSession = async () => {
    if (!selectedTeam || !sessionId) return;
    
    try {
      const response = await axios.post(`/api/hierarchy/teams/${selectedTeam.id}/sessions/${sessionId}`, {
        active_hierarchy: selectedTeam.hierarchy_structure
      });
      
      setSuccessMessage('Team session created successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to create team session');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getAgentName = (agentId: number) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : 'Unknown';
  };

  const getRoleName = (roleId: number) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown';
  };

  if (loading) {
    return <div className="p-4">Loading teams...</div>;
  }

  return (
    <div className="bg-gray-800 text-white rounded-lg shadow-lg p-4 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">Team Hierarchy Manager</h2>
      
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
      
      <div className="grid grid-cols-3 gap-4 flex-grow">
        <div className="col-span-1 bg-gray-900 rounded p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-3">Teams</h3>
          
          {teams.length === 0 ? (
            <p className="text-gray-400">No teams found</p>
          ) : (
            <div className="space-y-3 mb-4">
              {teams.map(team => (
                <div 
                  key={team.id} 
                  className={`p-3 rounded-lg cursor-pointer ${
                    selectedTeam?.id === team.id ? 'bg-blue-900' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedTeam(team)}
                >
                  <div className="font-semibold">{team.name}</div>
                  <div className="text-xs text-gray-400">
                    {team.members.length} agents, {team.available_roles.length} roles
                  </div>
                  <div className="text-xs text-gray-400">
                    Created: {formatTimestamp(team.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h3 className="text-lg font-semibold mb-3">Create New Team</h3>
            
            <div className="mb-3">
              <label className="block mb-1 text-sm">Team Name</label>
              <input 
                type="text"
                className="w-full bg-gray-700 text-white p-2 rounded"
                value={newTeam.name}
                onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                placeholder="Enter team name"
              />
            </div>
            
            <div className="mb-3">
              <label className="block mb-1 text-sm">Description</label>
              <textarea 
                className="w-full bg-gray-700 text-white p-2 rounded resize-none"
                rows={3}
                value={newTeam.description}
                onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                placeholder="Describe the team's purpose"
              />
            </div>
            
            <div className="mb-3 flex items-center">
              <input 
                type="checkbox" 
                id="is_public" 
                checked={newTeam.is_public} 
                onChange={() => setNewTeam({...newTeam, is_public: !newTeam.is_public})}
                className="mr-2"
              />
              <label htmlFor="is_public">Make this team public</label>
            </div>
            
            <div className="mb-3">
              <label className="block mb-1 text-sm">Select Agents</label>
              <div className="max-h-40 overflow-y-auto bg-gray-700 rounded p-2">
                {agents.map(agent => (
                  <div key={agent.id} className="flex items-center mb-1">
                    <input 
                      type="checkbox" 
                      id={`agent-${agent.id}`} 
                      checked={selectedAgents.includes(agent.id)} 
                      onChange={() => {
                        if (selectedAgents.includes(agent.id)) {
                          setSelectedAgents(selectedAgents.filter(id => id !== agent.id));
                        } else {
                          setSelectedAgents([...selectedAgents, agent.id]);
                        }
                      }}
                      className="mr-2"
                    />
                    <label htmlFor={`agent-${agent.id}`}>
                      {agent.name} ({agent.role})
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block mb-1 text-sm">Select Roles</label>
              <div className="max-h-40 overflow-y-auto bg-gray-700 rounded p-2">
                {roles.map(role => (
                  <div key={role.id} className="flex items-center mb-1">
                    <input 
                      type="checkbox" 
                      id={`role-${role.id}`} 
                      checked={selectedRoles.includes(role.id)} 
                      onChange={() => {
                        if (selectedRoles.includes(role.id)) {
                          setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                        } else {
                          setSelectedRoles([...selectedRoles, role.id]);
                        }
                      }}
                      className="mr-2"
                    />
                    <label htmlFor={`role-${role.id}`}>
                      {role.name} ({role.role_type})
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
              onClick={handleCreateTeam}
              disabled={!newTeam.name}
            >
              Create Team
            </button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h3 className="text-lg font-semibold mb-3">Create New Role</h3>
            
            <div className="mb-3">
              <label className="block mb-1 text-sm">Role Name</label>
              <input 
                type="text"
                className="w-full bg-gray-700 text-white p-2 rounded"
                value={newRole.name}
                onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                placeholder="Enter role name"
              />
            </div>
            
            <div className="mb-3">
              <label className="block mb-1 text-sm">Description</label>
              <textarea 
                className="w-full bg-gray-700 text-white p-2 rounded resize-none"
                rows={2}
                value={newRole.description}
                onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                placeholder="Describe the role's responsibilities"
              />
            </div>
            
            <div className="mb-3">
              <label className="block mb-1 text-sm">Role Type</label>
              <select 
                className="w-full bg-gray-700 text-white p-2 rounded"
                value={newRole.role_type}
                onChange={(e) => setNewRole({...newRole, role_type: e.target.value})}
              >
                <option value="leader">Leader</option>
                <option value="member">Member</option>
                <option value="specialist">Specialist</option>
                <option value="observer">Observer</option>
              </select>
            </div>
            
            <button 
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded w-full"
              onClick={handleCreateRole}
              disabled={!newRole.name}
            >
              Create Role
            </button>
          </div>
        </div>
        
        <div className="col-span-2 bg-gray-900 rounded p-4 overflow-y-auto">
          {selectedTeam ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Team: {selectedTeam.name}
                </h3>
                {sessionId && (
                  <button 
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm"
                    onClick={handleCreateTeamSession}
                  >
                    Use Team in Current Session
                  </button>
                )}
              </div>
              
              <div className="mb-4">
                <p className="text-gray-300">{selectedTeam.description}</p>
                <div className="text-sm text-gray-400 mt-1">
                  {selectedTeam.is_public ? 'Public team' : 'Private team'} • 
                  Created {formatTimestamp(selectedTeam.created_at)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-semibold mb-2 border-b border-gray-700 pb-1">Team Members</h4>
                  {selectedTeam.members.le
(Content truncated due to size limit. Use line ranges to read in chunks)