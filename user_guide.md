# DeGeNz Lounge - User Guide

## Introduction

Welcome to DeGeNz Lounge, an advanced AI Agent Orchestration Platform that allows you to create, customize, and deploy AI agents that collaborate in real-time. This guide will walk you through the main features and how to use the application effectively.

## Getting Started

### Installation

DeGeNz Lounge is containerized using Docker, making it easy to set up and run:

1. Clone the repository
2. Navigate to the project directory
3. Create a `.env` file based on the `.env.example` template
4. Run the application using Docker Compose:

```bash
docker-compose up -d
```

The application will be available at `http://localhost`.

### Registration and Login

1. Open your browser and navigate to `http://localhost`
2. Click on "Register" to create a new account
3. Fill in your username, email, and password
4. After registration, log in with your credentials

## Main Features

### Agent Creation

Create custom AI agents with specific roles, personalities, and behaviors:

1. Navigate to the Agent Library (left panel)
2. Click "Create New Agent"
3. Fill in the agent details:
   - **Name**: A unique identifier for your agent
   - **Role**: The agent's function (e.g., Researcher, Copywriter)
   - **Personality**: The agent's communication style (e.g., Analytical, Creative)
   - **System Instructions**: Specific guidelines for the agent's behavior
   - **Examples**: Sample interactions to guide the agent's responses
4. Click "Save" to add the agent to your library

### Sandbox Environment

The Sandbox is where agents collaborate on tasks:

1. Drag agents from the library into the Sandbox workspace
2. The first agent you add can be designated as the Manager Agent
3. Type your task or question in the chat input
4. The Manager Agent will delegate subtasks to other agents
5. Watch as agents collaborate in real-time to complete your task

### Persona Mode

Interact directly with a single agent:

1. Click on the "Persona Mode" tab
2. Select an agent from your library
3. Start a one-on-one conversation with the selected agent

## Working with Agents

### Agent Types

- **Manager Agent**: Orchestrates tasks between other agents
- **Specialist Agents**: Focus on specific domains or skills

### Effective Agent Creation Tips

1. **Clear Roles**: Define specific, non-overlapping roles
2. **Detailed Instructions**: Provide comprehensive system instructions
3. **Relevant Examples**: Include examples that demonstrate desired behavior
4. **Complementary Teams**: Create agents with complementary skills

### Sample Workflow

Here's an example of how to use DeGeNz Lounge for a marketing project:

1. Create these agents:
   - Market Researcher (Analytical personality)
   - Copywriter (Creative personality)
   - Designer (Visual personality)
   - Marketing Manager (Professional personality, set as Manager)

2. Add all agents to the Sandbox

3. Enter a prompt like: "Create a marketing campaign for an eco-friendly shoe brand"

4. The Manager will delegate tasks:
   - Researcher → Analyze market trends and target audience
   - Copywriter → Develop slogans and messaging
   - Designer → Suggest visual elements and packaging

5. Review the collaborative output and refine as needed

## Troubleshooting

### Common Issues

- **Agents not responding**: Ensure your WebSocket connection is active (check the connection status indicator)
- **Manager not delegating**: Verify that you've designated a Manager Agent in your Sandbox
- **Slow responses**: Complex tasks with multiple agents may take longer to process

### Support

For additional help, contact support at support@degenzlounge.com

## Advanced Features

### Agent Import/Export

Share your agents with others or back them up:

1. In the Agent Library, click the menu icon on an agent card
2. Select "Export" to download the agent as JSON
3. Use the "Import" button to load previously exported agents

### Custom Workflows

Create predefined workflows for common tasks:

1. Set up a Sandbox with the desired agents
2. Save the configuration as a workflow
3. Load the workflow for similar future tasks

## Conclusion

DeGeNz Lounge provides a powerful platform for creating and orchestrating AI agents. By following this guide, you'll be able to leverage the full potential of collaborative AI to tackle complex tasks and projects.

Happy collaborating!
