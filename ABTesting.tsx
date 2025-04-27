import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFlask, FaPlay, FaStop, FaChartBar, FaTrash, FaCheck, FaTimes, FaExchangeAlt } from 'react-icons/fa';
import { Line, Bar } from 'react-chartjs-2';

interface AgentVersion {
  id: number;
  agent_id: number;
  version_number: number;
  name: string;
  parameters: Record<string, any>;
  created_at: string;
  is_active: boolean;
}

interface ABTest {
  id: number;
  name: string;
  description: string | null;
  control_version_id: number;
  variant_version_id: number;
  test_parameters: Record<string, any>;
  status: string;
  start_date: string | null;
  end_date: string | null;
  results: Record<string, any> | null;
  created_at: string;
}

interface ABTestSession {
  id: number;
  ab_test_id: number;
  session_id: number;
  version_used: string;
  metrics: Record<string, any> | null;
  created_at: string;
}

interface ABTestingProps {
  agentId: number;
  agentName: string;
}

const ABTesting: React.FC<ABTestingProps> = ({ agentId, agentName }) => {
  const [versions, setVersions] = useState<AgentVersion[]>([]);
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('tests');
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [testSessions, setTestSessions] = useState<ABTestSession[]>([]);
  
  // New test form state
  const [showNewTestForm, setShowNewTestForm] = useState<boolean>(false);
  const [newTestName, setNewTestName] = useState<string>('');
  const [newTestDescription, setNewTestDescription] = useState<string>('');
  const [controlVersionId, setControlVersionId] = useState<number | null>(null);
  const [variantVersionId, setVariantVersionId] = useState<number | null>(null);
  const [testParameters, setTestParameters] = useState<Record<string, any>>({
    min_sessions: 10,
    min_feedback: 5,
    metrics_to_compare: ['response_time', 'task_completion_rate', 'user_rating']
  });
  const [creatingTest, setCreatingTest] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, [agentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch agent versions
      const versionsResponse = await axios.get(`/api/agent_versions/?agent_id=${agentId}`);
      setVersions(versionsResponse.data);
      
      // Fetch A/B tests
      const testsResponse = await axios.get(`/api/ab_tests/?agent_id=${agentId}`);
      setTests(testsResponse.data);
      
      // Set default control and variant versions if available
      if (versionsResponse.data.length >= 2) {
        const activeVersion = versionsResponse.data.find((v: AgentVersion) => v.is_active);
        if (activeVersion) {
          setControlVersionId(activeVersion.id);
          
          // Find the most recent non-active version for variant
          const otherVersions = versionsResponse.data
            .filter((v: AgentVersion) => v.id !== activeVersion.id)
            .sort((a: AgentVersion, b: AgentVersion) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          
          if (otherVersions.length > 0) {
            setVariantVersionId(otherVersions[0].id);
          }
        }
      }
      
    } catch (err) {
      setError('Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTest = async () => {
    if (!newTestName || !controlVersionId || !variantVersionId) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (controlVersionId === variantVersionId) {
      setError('Control and variant versions must be different');
      return;
    }
    
    try {
      setCreatingTest(true);
      setError(null);
      
      const response = await axios.post('/api/ab_tests/', {
        name: newTestName,
        description: newTestDescription || null,
        control_version_id: controlVersionId,
        variant_version_id: variantVersionId,
        test_parameters: testParameters,
        status: 'created'
      });
      
      // Add the new test to the list
      setTests(prev => [response.data, ...prev]);
      
      // Reset form
      setShowNewTestForm(false);
      setNewTestName('');
      setNewTestDescription('');
      setSuccess('A/B test created successfully!');
      
    } catch (err) {
      setError('Failed to create A/B test');
      console.error('Error creating A/B test:', err);
    } finally {
      setCreatingTest(false);
    }
  };

  const startTest = async (testId: number) => {
    try {
      setError(null);
      
      const response = await axios.put(`/api/ab_tests/${testId}/start`);
      
      // Update the test in the list
      setTests(prev => prev.map(t => t.id === testId ? response.data : t));
      
      setSuccess('A/B test started successfully!');
      
    } catch (err) {
      setError('Failed to start A/B test');
      console.error('Error starting A/B test:', err);
    }
  };

  const stopTest = async (testId: number) => {
    try {
      setError(null);
      
      const response = await axios.put(`/api/ab_tests/${testId}/stop`);
      
      // Update the test in the list
      setTests(prev => prev.map(t => t.id === testId ? response.data : t));
      
      setSuccess('A/B test stopped successfully!');
      
    } catch (err) {
      setError('Failed to stop A/B test');
      console.error('Error stopping A/B test:', err);
    }
  };

  const analyzeTest = async (testId: number) => {
    try {
      setError(null);
      
      const response = await axios.put(`/api/ab_tests/${testId}/analyze`);
      
      // Update the test in the list
      setTests(prev => prev.map(t => t.id === testId ? response.data : t));
      
      // Set as selected test to show results
      setSelectedTest(response.data);
      setActiveTab('results');
      
      setSuccess('A/B test analyzed successfully!');
      
    } catch (err) {
      setError('Failed to analyze A/B test');
      console.error('Error analyzing A/B test:', err);
    }
  };

  const deleteTest = async (testId: number) => {
    if (!window.confirm('Are you sure you want to delete this A/B test?')) {
      return;
    }
    
    try {
      setError(null);
      
      await axios.delete(`/api/ab_tests/${testId}`);
      
      // Remove the test from the list
      setTests(prev => prev.filter(t => t.id !== testId));
      
      // If this was the selected test, clear selection
      if (selectedTest && selectedTest.id === testId) {
        setSelectedTest(null);
      }
      
      setSuccess('A/B test deleted successfully!');
      
    } catch (err) {
      setError('Failed to delete A/B test');
      console.error('Error deleting A/B test:', err);
    }
  };

  const viewTestDetails = async (test: ABTest) => {
    setSelectedTest(test);
    setActiveTab('details');
    
    try {
      // Fetch test sessions
      const sessionsResponse = await axios.get(`/api/ab_tests/${test.id}/sessions`);
      setTestSessions(sessionsResponse.data);
    } catch (err) {
      console.error('Error fetching test sessions:', err);
    }
  };

  const getVersionName = (versionId: number) => {
    const version = versions.find(v => v.id === versionId);
    return version ? `${version.name} (v${version.version_number})` : `Version ${versionId}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'created':
        return <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">Created</span>;
      case 'running':
        return <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Running</span>;
      case 'completed':
        return <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Completed</span>;
      case 'analyzed':
        return <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">Analyzed</span>;
      default:
        return <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">{status}</span>;
    }
  };

  const renderTestResults = () => {
    if (!selectedTest || !selectedTest.results) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400">No results available for this test.</p>
        </div>
      );
    }
    
    const results = selectedTest.results;
    
    // Prepare data for comparison chart
    const comparisonData = {
      labels: ['Average Rating', 'Response Time (s)', 'Task Completion (%)'],
      datasets: [
        {
          label: 'Control',
          data: [
            results.control.feedback.avg_rating || 0,
            results.control.performance.response_time || 0,
            (results.control.performance.task_completion_rate || 0) * 100
          ],
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'Variant',
          data: [
            results.variant.feedback.avg_rating || 0,
            results.variant.performance.response_time || 0,
            (results.variant.performance.task_completion_rate || 0) * 100
          ],
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        }
      ],
    };
    
    return (
      <div className="space-y-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Test Results Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-sm text-gray-400 mb-1">Winner</div>
              <div className="flex items-center">
                {results.comparison.winner === 'control' && (
                  <>
                    <div className="text-lg font-bold text-blue-400">Control</div>
                    <div className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      {results.comparison.confidence.toFixed(0)}% confidence
                    </div>
                  </>
                )}
                {results.comparison.winner === 'variant' && (
                  <>
                    <div className="text-lg font-bold text-pink-400">Variant</div>
                    <div className="ml-2 bg-pink-600 text-white text-xs px-2 py-1 rounded">
                      {results.comparison.confidence.toFixed(0)}% confidence
                    </div>
                  </>
                )}
                {results.comparison.winner === 'tie' && (
                  <div className="text-lg font-bold text-gray-400">Tie</div>
                )}
              </div>
            </div>
            
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-sm text-gray-400 mb-1">Sample Size</div>
              <div className="text-lg">
                <span className="font-bold text-blue-400">{results.control.session_count}</span>
                <span className="text-gray-400 mx-2">vs</span>
                <span className="font-bold text-pink-400">{results.variant.session_count}</span>
              </div>
              <div className="text-xs text-gray-400">Control vs Variant Sessions</div>
            </div>
            
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-sm text-gray-400 mb-1">Feedback Count</div>
              <div className="text-lg">
                <span className="font-bold text-blue-400">{results.control.feedback.count}</span>
                <span className="text-gray-400 mx-2">vs</span>
                <span className="font-bold text-pink-400">{results.variant.feedback.count}</span>
              </div>
              <div className="text-xs text-gray-400">Control vs Variant Feedback</div>
            </div>
          </div>
          
          <div className="h-64 mb-4">
            <Bar 
              data={comparisonData} 
              options={{
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                  x: {
                    ticks: {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                },
                plugins: {
                  legend: {
                    labels: {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  },
                },
                maintainAspectRatio: false,
              }}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-md font-medium mb-2">Key Differences</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Rating Difference:</span>
                  <span className={results.comparison.rating_diff > 0 ? 'text-green-400' : results.comparison.rating_diff < 0 ? 'text-red-400' : 'text-gray-400'}>
                    {results.comparison.rating_diff > 0 ? '+' : ''}{results.comparison.rating_diff.toFixed(2)}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Response Time Difference:</span>
                  <span className={results.comparison.response_time_diff > 0 ? 'text-green-400' : results.comparison.response_time_diff < 0 ? 'text-red-400' : 'text-gray-400'}>
                    {results.comparison.response_time_diff > 0 ? '+' : ''}{results.comparison.response_time_diff.toFixed(2)}s
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Completion Rate Difference:</span>
                  <span className={results.comparison.completion_rate_diff > 0 ? 'text-green-400' : results.comparison.completion_rate_diff < 0 ? 'text-red-400' : 'text-gray-400'}>
                    {results.comparison.completion_rate_diff > 0 ? '+' : ''}{(results.comparison.completion_rate_diff * 100).toFixed(1)}%
                  </span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-md font-medium mb-2">Recommendation</h4>
              <div className="bg-gray-800 p-3 rounded text-sm">
                {results.comparison.winner === 'variant' && results.comparison.confidence >= 70 && (
                  <p>
                    The variant version significantly outperforms the control version. 
                    We recommend making the variant version the new default.
                  </p>
                )}
                {results.comparison.winner === 'variant' && results.comparison.confidence < 70 && (
                  <p>
                    The variant version shows some improvements over the control version, 
                    but with limited confidence. Consider running the test longer or 
                    making more significant changes to the variant.
                  </p>
                )}
                {results.comparison.winner === 'control' && results.comparison.confidence >= 70 && (
                  <p>
                    The control version significantly outperforms the variant version. 
                    We recom
(Content truncated due to size limit. Use line ranges to read in chunks)