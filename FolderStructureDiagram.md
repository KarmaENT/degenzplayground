project-root/
├── backend/                    # Backend Python files
│   ├── api/                    # API routes and services
│   │   ├── auth.py
│   │   ├── connection.py
│   │   ├── providers.py
│   │   ├── unified_service.py
│   │   └── ...
│   ├── models/                 # Data models
│   │   ├── collaboration_models.py
│   │   ├── hierarchy_models.py
│   │   ├── knowledge_models.py
│   │   ├── learning_models.py
│   │   ├── prompt_models.py
│   │   └── models.py
│   ├── services/               # Business logic and services
│   │   ├── ai_service.py
│   │   ├── gemini_service.py
│   │   ├── knowledge_service.py
│   │   ├── prompt_service.py
│   │   └── ...
│   ├── tests/                  # Backend tests
│   │   ├── test_ai_services.py
│   │   ├── test_api.py
│   │   ├── test_collaboration_features.py
│   │   └── ...
│   ├── main.py                 # Entry point for backend
│   ├── server.py               # Server configuration
│   ├── schemas.py              # Data schemas
│   ├── database.py             # Database setup
│   ├── init_db.py              # Database initialization
│   ├── requirements.txt        # Python dependencies
│   └── docker-compose.yml      # Docker compose configuration
├── frontend/                   # Frontend React/TSX files
│   ├── src/                    # Source files
│   │   ├── components/         # Reusable components
│   │   │   ├── AgentCard.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── FeedbackComponent.tsx
│   │   │   ├── Tabs.tsx
│   │   │   └── ...
│   │   ├── pages/              # Page-level components
│   │   │   ├── EnhancedDesignApp.tsx
│   │   │   ├── SandboxWorkspace.tsx
│   │   │   ├── WorkflowEditor.tsx
│   │   │   └── ...
│   │   ├── styles/             # CSS and styling
│   │   │   ├── App.css
│   │   │   ├── enhanced-styles.css
│   │   │   ├── index.css
│   │   │   ├── styles.css
│   │   │   └── ...
│   │   ├── tests/              # Frontend tests
│   │   │   ├── AgentLearning.test.tsx
│   │   │   ├── EnhancedDesignApp.test.tsx
│   │   │   ├── UIComponents.test.tsx
│   │   │   └── ...
│   │   ├── App.tsx             # Main app component
│   │   ├── index.tsx           # Entry point for frontend
│   │   └── webpack.enhanced-design.config.js  # Webpack configuration
│   ├── public/                 # Public assets
│   │   ├── index.html
│   │   ├── enhanced-design.html
│   │   ├── saved-sessions.html
│   │   └── ...
│   ├── package.json            # Frontend dependencies
│   └── Dockerfile              # Frontend Docker configuration
├── docs/                       # Documentation files
│   ├── advanced_collaboration_features.md
│   ├── agent_learning_documentation.md
│   ├── api_documentation.md
│   ├── deployment_instructions.md
│   ├── deployment_options.md
│   ├── improvement_recommendations.md
│   ├── monetization_strategy.md
│   ├── todo.md
│   ├── user_guide.md
│   └── ...
├── config/                     # Configuration files
│   ├── nginx.conf
│   └── ...
├── misc/                       # Miscellaneous files
│   ├── pasted_content.txt
│   ├── pasted_content_2.txt
│   └── ...
└── README.md                   # Project overview