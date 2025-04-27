# DeGeNz Lounge API Documentation

## Overview

DeGeNz Lounge is an AI Agent Orchestration Platform with Multi-Agent Sandbox Collaboration. This document provides details about the API endpoints available in the application.

## Base URL

```
http://localhost:8000
```

## Authentication

Most endpoints require authentication using JWT tokens. To authenticate, include the token in the Authorization header:

```
Authorization: Bearer <your_token>
```

To obtain a token, use the `/auth/token` endpoint.

## Endpoints

### Authentication

#### Register a new user

```
POST /auth/register
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "id": "integer",
  "username": "string",
  "email": "string",
  "is_active": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

#### Get access token

```
POST /auth/token
```

**Request Body (form data):**
```
username: string
password: string
```

**Response:**
```json
{
  "access_token": "string",
  "token_type": "string"
}
```

### Agents

#### Create a new agent

```
POST /agents/
```

**Request Body:**
```json
{
  "name": "string",
  "role": "string",
  "personality": "string",
  "system_instructions": "string",
  "examples": [
    {
      "input": "string",
      "output": "string"
    }
  ]
}
```

**Response:**
```json
{
  "id": "integer",
  "name": "string",
  "role": "string",
  "personality": "string",
  "system_instructions": "string",
  "examples": [
    {
      "input": "string",
      "output": "string"
    }
  ],
  "owner_id": "integer",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

#### Get all agents

```
GET /agents/
```

**Query Parameters:**
```
skip: integer (default: 0)
limit: integer (default: 100)
```

**Response:**
```json
[
  {
    "id": "integer",
    "name": "string",
    "role": "string",
    "personality": "string",
    "system_instructions": "string",
    "examples": [
      {
        "input": "string",
        "output": "string"
      }
    ],
    "owner_id": "integer",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
]
```

#### Get a specific agent

```
GET /agents/{agent_id}
```

**Path Parameters:**
```
agent_id: integer
```

**Response:**
```json
{
  "id": "integer",
  "name": "string",
  "role": "string",
  "personality": "string",
  "system_instructions": "string",
  "examples": [
    {
      "input": "string",
      "output": "string"
    }
  ],
  "owner_id": "integer",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

#### Update an agent

```
PUT /agents/{agent_id}
```

**Path Parameters:**
```
agent_id: integer
```

**Request Body:**
```json
{
  "name": "string",
  "role": "string",
  "personality": "string",
  "system_instructions": "string",
  "examples": [
    {
      "input": "string",
      "output": "string"
    }
  ]
}
```

**Response:**
```json
{
  "id": "integer",
  "name": "string",
  "role": "string",
  "personality": "string",
  "system_instructions": "string",
  "examples": [
    {
      "input": "string",
      "output": "string"
    }
  ],
  "owner_id": "integer",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

#### Delete an agent

```
DELETE /agents/{agent_id}
```

**Path Parameters:**
```
agent_id: integer
```

**Response:**
```
204 No Content
```

### Sandbox

#### Start a new sandbox session

```
POST /sandbox/start
```

**Request Body:**
```json
{
  "name": "string",
  "description": "string"
}
```

**Response:**
```json
{
  "id": "integer",
  "name": "string",
  "description": "string",
  "owner_id": "integer",
  "is_active": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

#### Get all sandbox sessions

```
GET /sandbox/sessions
```

**Query Parameters:**
```
skip: integer (default: 0)
limit: integer (default: 100)
```

**Response:**
```json
[
  {
    "id": "integer",
    "name": "string",
    "description": "string",
    "owner_id": "integer",
    "is_active": "boolean",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
]
```

#### Get a specific sandbox session

```
GET /sandbox/sessions/{session_id}
```

**Path Parameters:**
```
session_id: integer
```

**Response:**
```json
{
  "id": "integer",
  "name": "string",
  "description": "string",
  "owner_id": "integer",
  "is_active": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

#### Add an agent to a sandbox session

```
POST /sandbox/sessions/{session_id}/agents
```

**Path Parameters:**
```
session_id: integer
```

**Query Parameters:**
```
agent_id: integer
is_manager: boolean (default: false)
```

**Response:**
```json
{
  "status": "string",
  "message": "string"
}
```

#### Send a message in a sandbox session

```
POST /sandbox/sessions/{session_id}/message
```

**Path Parameters:**
```
session_id: integer
```

**Request Body:**
```json
{
  "content": "string",
  "parent_id": "integer (optional)"
}
```

**Response:**
```json
{
  "id": "integer",
  "content": "string",
  "session_id": "integer",
  "session_agent_id": "integer (optional)",
  "user_id": "integer (optional)",
  "parent_id": "integer (optional)",
  "created_at": "datetime"
}
```

### WebSocket

#### Connect to a sandbox session

```
WebSocket: /ws/{session_id}/{client_id}
```

**Path Parameters:**
```
session_id: string
client_id: string
```

**Messages:**

1. User Message:
```json
{
  "type": "user_message",
  "content": "string",
  "session_id": "string",
  "client_id": "string"
}
```

2. Agent Added:
```json
{
  "type": "agent_added",
  "agent_id": "integer",
  "agent_name": "string",
  "session_id": "string",
  "client_id": "string"
}
```

**Responses:**

1. Agent Message:
```json
{
  "type": "agent_message",
  "data": {
    "id": "integer",
    "content": "string",
    "agent_name": "string",
    "agent_role": "string",
    "timestamp": "string"
  }
}
```

2. Notification:
```json
{
  "type": "notification",
  "client_id": "string",
  "message": "string"
}
```

3. Error:
```json
{
  "type": "error",
  "message": "string"
}
```

## Error Responses

The API uses standard HTTP status codes to indicate the success or failure of requests:

- `200 OK`: The request was successful
- `201 Created`: A new resource was successfully created
- `204 No Content`: The request was successful but there is no content to return
- `400 Bad Request`: The request was invalid or cannot be served
- `401 Unauthorized`: Authentication is required or failed
- `403 Forbidden`: The authenticated user does not have permission to access the resource
- `404 Not Found`: The requested resource does not exist
- `500 Internal Server Error`: An error occurred on the server
