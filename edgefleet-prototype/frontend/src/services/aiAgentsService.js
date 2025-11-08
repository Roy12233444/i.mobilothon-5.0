import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Get all AI agents
 * @returns {Promise<Array>} List of AI agents
 */
export const getAIAgents = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ai-agents/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching AI agents:', error);
    throw error;
  }
};

/**
 * Get a specific AI agent by ID
 * @param {string} agentId - The ID of the agent to fetch
 * @returns {Promise<Object>} The agent data
 */
export const getAIAgent = async (agentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ai-agents/${agentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching AI agent ${agentId}:`, error);
    throw error;
  }
};

/**
 * Update an AI agent's status or settings
 * @param {string} agentId - The ID of the agent to update
 * @param {Object} updates - The updates to apply
 * @returns {Promise<Object>} The updated agent data
 */
export const updateAIAgent = async (agentId, updates) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/api/ai-agents/${agentId}`, 
      updates
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating AI agent ${agentId}:`, error);
    throw error;
  }
};

/**
 * Refresh an AI agent's data
 * @param {string} agentId - The ID of the agent to refresh
 * @returns {Promise<Object>} The refreshed agent data
 */
export const refreshAIAgent = async (agentId) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/ai-agents/${agentId}/refresh`
    );
    return response.data;
  } catch (error) {
    console.error(`Error refreshing AI agent ${agentId}:`, error);
    throw error;
  }
};

/**
 * Execute an AI agent with the given parameters
 * @param {string} agentId - The ID of the agent to execute
 * @param {Object} params - The parameters for execution
 * @returns {Promise<Object>} The execution results
 */
export const executeAIAgent = async (agentId, params = {}) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/ai-agents/${agentId}/execute`,
      params
    );
    return response.data;
  } catch (error) {
    console.error(`Error executing AI agent ${agentId}:`, error);
    throw error;
  }
};

export default {
  getAIAgents,
  getAIAgent,
  updateAIAgent,
  refreshAIAgent,
  executeAIAgent
};
