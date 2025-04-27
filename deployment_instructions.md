# DeGeNz Lounge - Detailed Deployment Instructions

This document provides step-by-step instructions for deploying the DeGeNz Lounge application using various methods. Each deployment option includes detailed commands, configuration files, and troubleshooting tips.

## AI Provider Configuration

DeGeNz Lounge now supports multiple AI providers including:
- Gemini (default)
- OpenAI
- OpenRouter
- Grok
- DeepSeek
- Perplexity
- Hugging Face
- Mistral

### Obtaining API Keys

Before deployment, you'll need to obtain API keys for the providers you wish to use:

1. **Gemini API Key**: Visit [Google AI Studio](https://ai.google.dev/) to create an account and generate an API key
2. **OpenAI API Key**: Sign up at [OpenAI Platform](https://platform.openai.com/) and create an API key
3. **OpenRouter API Key**: Register at [OpenRouter](https://openrouter.ai/) to get an API key
4. **Grok API Key**: Available through [xAI](https://x.ai/) for subscribers
5. **DeepSeek API Key**: Register at [DeepSeek](https://www.deepseek.com/) to obtain an API key
6. **Perplexity API Key**: Sign up at [Perplexity AI](https://www.perplexity.ai/) and generate an API key
7. **Hugging Face API Key**: Create an account at [Hugging Face](https://huggingface.co/) and generate an access token
8. **Mistral API Key**: Register at [Mistral AI](https://mistral.ai/) to get an API key

### Environment Variables Configuration

For all deployment methods, you'll need to configure the following environment variables:

```
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
GROK_API_KEY=your_grok_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
MISTRAL_API_KEY=your_mistral_api_key
```

Note: Only the Gemini API key is required. All other providers are optional and will be enabled only if their respective API keys are provided.

## Table of Contents

1. [Docker Deployment](#docker-deployment)
2. [AWS Deployment](#aws-deployment)
3. [Google Cloud Platform Deployment](#google-cloud-platform-deployment)
4. [Vercel & Heroku Deployment](#vercel--heroku-deployment)
5. [DigitalOcean Deployment](#digitalocean-deployment)
6. [Microsoft Azure Deployment](#microsoft-azure-deployment)
7. [Self-Hosting on VPS](#self-hosting-on-vps)
8. [Kubernetes Deployment](#kubernetes-deployment)
9. [Troubleshooting Common Issues](#troubleshooting-common-issues)
10. [Testing AI Providers](#testing-ai-providers)

## Docker Deployment

Docker provides the simplest and most consistent deployment experience, ensuring the application runs the same way in all environments.

### Prerequisites

- Docker Engine (v20.10+)
- Docker Compose (v2.0+)
- Git

### Step-by-Step Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/degenz-lounge.git
   cd degenz-lounge
   ```

2. **Configure environment variables**

   ```bash
   cp backend/.env.example backend/.env
   ```

   Edit the `.env` file to add your configuration:

   ```
   # Database Configuration
   DATABASE_URL=postgresql://postgres:postgres@db:5432/degenz_lounge
   
   # Required API Key
   GEMINI_API_KEY=your_gemini_api_key
   
   # Optional API Keys for Additional Providers
   OPENAI_API_KEY=your_openai_api_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   GROK_API_KEY=your_grok_api_key
   DEEPSEEK_API_KEY=your_deepseek_api_key
   PERPLEXITY_API_KEY=your_perplexity_api_key
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   MISTRAL_API_KEY=your_mistral_api_key
   
   # JWT Secret
   JWT_SECRET=your_jwt_secret_key
   
   # Redis Configuration
   REDIS_URL=redis://redis:6379/0
   
   # Application Settings
   DEBUG=false
   LOG_LEVEL=info
   ```

3. **Build and start the containers**

   ```bash
   docker-compose up -d
   ```

   This command will:
   - Build the backend and frontend images
   - Start PostgreSQL and Redis containers
   - Start the backend API server
   - Start the frontend application
   - Set up networking between containers

4. **Initialize the database**

   ```bash
   docker-compose exec backend python init_db.py
   ```

5. **Verify the deployment**

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/docs

### Docker Compose File Explanation

The `docker-compose.yml` file includes:

```yaml
version: '3.8'

services:
  db:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_USER=postgres
      - POSTGRES_DB=degenz_lounge
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    volumes:
      - ./backend:/app
    ports:
      - "5000:5000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    env_file:
      - ./backend/.env

  frontend:
    build: ./frontend
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

### Updating the Application

To update the application after making changes:

```bash
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

### Troubleshooting Docker Deployment

- **Database connection issues**: Ensure PostgreSQL container is running with `docker-compose ps`. Check logs with `docker-compose logs db`.
- **Backend not starting**: Check logs with `docker-compose logs backend`. Verify environment variables are set correctly.
- **Frontend not connecting to backend**: Ensure the API URL in frontend configuration points to the backend service.

## AWS Deployment

AWS offers multiple deployment options. We'll cover Elastic Beanstalk (simplest) and ECS (more advanced).

### AWS Elastic Beanstalk Deployment

#### Prerequisites

- AWS account
- AWS CLI installed and configured
- EB CLI installed
- Git

#### Step-by-Step Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/degenz-lounge.git
   cd degenz-lounge
   ```

2. **Create Dockerrun.aws.json file**

   Create a file named `Dockerrun.aws.json` in the project root:

   ```json
   {
     "AWSEBDockerrunVersion": "3",
     "containerDefinitions": [
       {
         "name": "db",
         "image": "postgres:14",
         "essential": true,
         "memory": 256,
         "environment": [
           {
             "name": "POSTGRES_PASSWORD",
             "value": "postgres"
           },
           {
             "name": "POSTGRES_USER",
             "value": "postgres"
           },
           {
             "name": "POSTGRES_DB",
             "value": "degenz_lounge"
           }
         ],
         "portMappings": [
           {
             "hostPort": 5432,
             "containerPort": 5432
           }
         ],
         "mountPoints": [
           {
             "sourceVolume": "postgres-data",
             "containerPath": "/var/lib/postgresql/data"
           }
         ]
       },
       {
         "name": "redis",
         "image": "redis:7",
         "essential": true,
         "memory": 128,
         "portMappings": [
           {
             "hostPort": 6379,
             "containerPort": 6379
           }
         ],
         "mountPoints": [
           {
             "sourceVolume": "redis-data",
             "containerPath": "/data"
           }
         ]
       },
       {
         "name": "backend",
         "image": "yourusername/degenz-lounge-backend",
         "essential": true,
         "memory": 512,
         "portMappings": [
           {
             "hostPort": 5000,
             "containerPort": 5000
           }
         ],
         "links": ["db", "redis"]
       },
       {
         "name": "frontend",
         "image": "yourusername/degenz-lounge-frontend",
         "essential": true,
         "memory": 256,
         "portMappings": [
           {
             "hostPort": 80,
             "containerPort": 3000
           }
         ],
         "links": ["backend"]
       }
     ],
     "volumes": [
       {
         "name": "postgres-data",
         "host": {
           "sourcePath": "/var/app/postgres-data"
         }
       },
       {
         "name": "redis-data",
         "host": {
           "sourcePath": "/var/app/redis-data"
         }
       }
     ]
   }
   ```

3. **Initialize Elastic Beanstalk application**

   ```bash
   eb init degenz-lounge --platform docker --region us-west-2
   ```

4. **Create environment and deploy**

   ```bash
   eb create degenz-lounge-env --envvars GEMINI_API_KEY=your_gemini_api_key,OPENAI_API_KEY=your_openai_api_key,JWT_SECRET=your_jwt_secret
   ```

5. **Configure environment variables through AWS console**

   - Go to AWS Elastic Beanstalk console
   - Select your environment
   - Go to Configuration > Software
   - Add environment variables for API keys and other sensitive data:
     - `GEMINI_API_KEY` (required)
     - `OPENAI_API_KEY` (optional)
     - `OPENROUTER_API_KEY` (optional)
     - `GROK_API_KEY` (optional)
     - `DEEPSEEK_API_KEY` (optional)
     - `PERPLEXITY_API_KEY` (optional)
     - `HUGGINGFACE_API_KEY` (optional)
     - `MISTRAL_API_KEY` (optional)
     - `JWT_SECRET`

6. **Initialize the database**

   ```bash
   eb ssh
   cd /var/app/current
   docker exec $(docker ps -q -f name=backend) python init_db.py
   ```

7. **Access your application**

   The URL will be displayed in the Elastic Beanstalk console or in the output of the `eb create` command.

### AWS ECS Deployment

For more advanced deployments with better scaling capabilities:

#### Prerequisites

- AWS account
- AWS CLI installed and configured
- Docker installed
- Git

#### Step-by-Step Instructions

1. **Create ECR repositories**

   ```bash
   aws ecr create-repository --repository-name degenz-lounge-backend
   aws ecr create-repository --repository-name degenz-lounge-frontend
   ```

2. **Build and push Docker images**

   ```bash
   # Login to ECR
   aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com

   # Build and push backend image
   cd degenz-lounge/backend
   docker build -t degenz-lounge-backend .
   docker tag degenz-lounge-backend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com/degenz-lounge-backend:latest
   docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com/degenz-lounge-backend:latest

   # Build and push frontend image
   cd ../frontend
   docker build -t degenz-lounge-frontend .
   docker tag degenz-lounge-frontend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com/degenz-lounge-frontend:latest
   docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com/degenz-lounge-frontend:latest
   ```

3. **Create RDS PostgreSQL database**

   ```bash
   aws rds create-db-instance \
     --db-instance-identifier degenz-lounge-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username postgres \
     --master-user-password your_password \
     --allocated-storage 20 \
     --db-name degenz_lounge
   ```

4. **Create ElastiCache Redis cluster**

   ```bash
   aws elasticache create-cache-cluster \
     --cache-cluster-id degenz-lounge-redis \
     --engine redis \
     --cache-node-type cache.t3.micro \
     --num-cache-nodes 1
   ```

5. **Create ECS cluster**

   ```bash
   aws ecs create-cluster --cluster-name degenz-lounge-cluster
   ```

6. **Create task definitions**

   Create a file named `backend-task-definition.json`:

   ```json
   {
     "family": "degenz-lounge-backend",
     "networkMode": "awsvpc",
     "executionRoleArn": "arn:aws:iam::your_account_id:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "backend",
         "image": "your_account_id.dkr.ecr.us-west-2.amazonaws.com/degenz-lounge-backend:latest",
         "essential": true,
         "portMappings": [
           {
             "containerPort": 5000,
             "hostPort": 5000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "DATABASE_URL",
             "value": "postgresql://postgres:your_password@your_rds_endpoint:5432/degenz_lounge"
           },
           {
             "name": "REDIS_URL",
             "value": "redis://your_elasticache_endpoint:6379/0"
           },
           {
             "name": "GEMINI_API_KEY",
             "value": "your_gemini_api_key"
           },
           {
             "name": "OPENAI_API_KEY",
             "value": "your_openai_api_key"
           },
           {
             "name": "OPENROUTER_API_KEY",
             "value": "your_openrouter_api_key"
           },
           {
             "name": "GROK_API_KEY",
             "value": "your_grok_api_key"
           },
           {
             "name": "DEEPSEEK_API_KEY",
             "value": "your_deepseek_api_key"
           },
           {
             "name": "PERPLEXITY_API_KEY",
             "value": "your_perplexity_api_key"
           },
           {
             "name": "HUGGINGFACE_API_KEY",
             "value": "your_huggingface_api_key"
           },
           {
             "name": "MISTRAL_API_KEY",
             "value": "your_mistral_api_key"
           },
           {
             "name": "JWT_SECRET",
             "value": "your_jwt_secret"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/degenz-lounge-backend",
             "awslogs-region": "us-west-2",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ],
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "512",
     "memory": "1024"
   }
   ```

   Create a file named `frontend-task-definition.json`:

   ```json
   {
     "family": "degenz-lounge-frontend",
     "networkMode": "awsvpc",
     "executionRoleArn": "arn:aws:iam::your_account_id:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "frontend",
         "image": "your_account_id.dkr.ecr.us-west-2.amazonaws.com/degenz-lounge-frontend:latest",
         "essential": true,
         "portMappings": [
           {
             "containerPort": 3000,
             "hostPort": 3000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "REACT_APP_API_URL",
             "value": "https://your-backend-alb-url.us-west-2.elb.amazonaws.com"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/degenz-lounge-frontend",
             "awslogs-region": "us-west-2",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ],
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512"
   }
   ```

   Register the task definitions:

   ```bash
   aws ecs register-task-definition --cli-input-json file://backend-task-definition.json
   aws ecs register-task-definition --cli-input-json file://frontend-task-definition.json
   ```

7. **Create security groups**

   ```bash
   # Create backend security group
   aws ec2 create-security-group --group-name degenz-lounge-backend-sg --description "Security group for DeGeNz Lounge backend"
   aws ec2 authorize-security-group-ingress --group-name degenz-lounge-backend-sg --protocol tcp --port 5000 --cidr 0.0.0.0/0

   # Create frontend security group
   aws ec2 create-security-group --group-name degenz-lounge-frontend-sg --description "Security group for DeGeNz Lounge frontend"
   aws ec2 authorize-security-group-ingress --group-name degenz-lounge-frontend-sg --protocol tcp --port 3000 --cidr 0.0.0.0/0
   ```

8. **Create ECS services**

   ```bash
   # Create backend service
   aws ecs create-service \
     --cluster degenz-lounge-cluster \
     --service-name degenz-lounge-backend \
     --task-definition degenz-lounge-backend \
     --desired-count 1 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-12345678,subnet-87654321],securityGroups=[sg-12345678],assignPublicIp=ENABLED}"

   # Create frontend service
   aws ecs create-service \
     --cluster degenz-lounge-cluster \
     --service-name degenz-lounge-frontend \
     --task-definition degenz-lounge-frontend \
     --desired-count 1 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-12345678,subnet-87654321],securityGroups=[sg-87654321],assignPublicIp=ENABLED}"
   ```

9. **Create Application Load Balancers**

   Follow the AWS console instructions to create ALBs for both the frontend and backend services.

10. **Initialize the database**

    Connect to the backend container and run:

    ```bash
    python init_db.py
    ```

## Google Cloud Platform Deployment

Google Cloud Platform offers several deployment options. We'll cover Cloud Run (serverless) and GKE (Kubernetes).

### Google Cloud Run Deployment

#### Prerequisites

- Google Cloud account
- gcloud CLI installed and configured
- Docker installed
- Git

#### Step-by-Step Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/degenz-lounge.git
   cd degenz-lounge
   ```

2. **Create Cloud SQL PostgreSQL instance**

   ```bash
   gcloud sql instances create degenz-lounge-db \
     --database-version=POSTGRES_14 \
     --tier=db-f1-micro \
     --region=us-central1 \
     --root-password=your_password
   ```

3. **Create database**

   ```bash
   gcloud sql databases create degenz_lounge --instance=degenz-lounge-db
   ```

4. **Create Redis instance using Memorystore**

   ```bash
   gcloud redis instances create degenz-lounge-redis \
     --size=1 \
     --region=us-central1 \
     --redis-version=redis_6_x
   ```

5. **Configure environment variables**

   Create a file named `backend/.env` with the following content:

   ```
   DATABASE_URL=postgresql://postgres:your_password@/degenz_lounge?host=/cloudsql/your-project-id:us-central1:degenz-lounge-db
   REDIS_URL=redis://your-redis-ip:6379/0
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   GROK_API_KEY=your_grok_api_key
   DEEPSEEK_API_KEY=your_deepseek_api_key
   PERPLEXITY_API_KEY=your_perplexity_api_key
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   MISTRAL_API_KEY=your_mistral_api_key
   JWT_SECRET=your_jwt_secret
   ```

6. **Build and deploy backend**

   ```bash
   # Build the container
   cd backend
   gcloud builds submit --tag gcr.io/your-project-id/degenz-lounge-backend

   # Deploy to Cloud Run
   gcloud run deploy degenz-lounge-backend \
     --image gcr.io/your-project-id/degenz-lounge-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --add-cloudsql-instances your-project-id:us-central1:degenz-lounge-db \
     --set-env-vars="DATABASE_URL=postgresql://postgres:your_password@/degenz_lounge?host=/cloudsql/your-project-id:us-central1:degenz-lounge-db,REDIS_URL=redis://your-redis-ip:6379/0,GEMINI_API_KEY=your_gemini_api_key,OPENAI_API_KEY=your_openai_api_key,OPENROUTER_API_KEY=your_openrouter_api_key,GROK_API_KEY=your_grok_api_key,DEEPSEEK_API_KEY=your_deepseek_api_key,PERPLEXITY_API_KEY=your_perplexity_api_key,HUGGINGFACE_API_KEY=your_huggingface_api_key,MISTRAL_API_KEY=your_mistral_api_key,JWT_SECRET=your_jwt_secret"
   ```

7. **Initialize the database**

   ```bash
   # Create a temporary instance to run the migration
   gcloud run jobs create init-db \
     --image gcr.io/your-project-id/degenz-lounge-backend \
     --command python \
     --args init_db.py \
     --set-cloudsql-instances your-project-id:us-central1:degenz-lounge-db \
     --set-env-vars="DATABASE_URL=postgresql://postgres:your_password@/degenz_lounge?host=/cloudsql/your-project-id:us-central1:degenz-lounge-db"

   # Run the job
   gcloud run jobs execute init-db
   ```

8. **Build and deploy frontend**

   ```bash
   # Get the backend URL
   BACKEND_URL=$(gcloud run services describe degenz-lounge-backend --platform managed --region us-central1 --format="value(status.url)")

   # Update frontend environment
   cd ../frontend
   echo "REACT_APP_API_URL=$BACKEND_URL" > .env

   # Build the container
   gcloud builds submit --tag gcr.io/your-project-id/degenz-lounge-frontend

   # Deploy to Cloud Run
   gcloud run deploy degenz-lounge-frontend \
     --image gcr.io/your-project-id/degenz-lounge-frontend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="REACT_APP_API_URL=$BACKEND_URL"
   ```

9. **Access your application**

   ```bash
   gcloud run services describe degenz-lounge-frontend --platform managed --region us-central1 --format="value(status.url)"
   ```

## Testing AI Providers

After deploying your application, you should test each AI provider to ensure they're properly configured and working. Here's how to test each provider:

### Testing from the UI

1. **Access the Settings Page**
   - Log in to your application
   - Navigate to the Settings page
   - Go to the "AI Providers" section

2. **Verify API Keys**
   - Ensure your API keys are properly saved for each provider
   - The application will show a "Connected" status for providers with valid API keys

3. **Test Each Provider**
   - Create a new agent or use the Persona mode
   - Select each provider from the dropdown and send a test message
   - Verify that you receive appropriate responses

### Testing from the Backend

You can also test the AI providers directly from the backend using the following steps:

1. **Connect to your backend server**

   ```bash
   # For Docker deployment
   docker-compose exec backend bash
   
   # For Kubernetes deployment
   kubectl exec -it $(kubectl get pods -l app=backend -o jsonpath="{.items[0].metadata.name}") -- bash
   
   # For Cloud Run, create a temporary instance
   gcloud run jobs create test-providers \
     --image gcr.io/your-project-id/degenz-lounge-backend \
     --command bash
   ```

2. **Create a test script**

   Create a file named `test_providers.py`:

   ```python
   from app.services.ai.unified_service import UnifiedAIService
   
   # Initialize the unified service
   ai_service = UnifiedAIService()
   
   # List available providers
   providers = ai_service.list_providers()
   print(f"Available providers: {providers}")
   
   # Test each provider
   test_prompt = "Tell me a short joke about programming."
   
   for provider in providers:
       print(f"\nTesting {provider}...")
       try:
           response = ai_service.generate_response(
               provider_name=provider,
               prompt=test_prompt,
               temperature=0.7,
               max_tokens=100
           )
           
           if "error" in response:
               print(f"Error: {response['error']}")
           else:
               content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
               if content:
                   print(f"Response: {content}")
               else:
                   print("No content in response")
       except Exception as e:
           print(f"Exception: {e}")
   ```

3. **Run the test script**

   ```bash
   python test_providers.py
   ```

4. **Check the results**

   The script will output the test results for each provider. If a provider is properly configured, you should see a joke in the response. If there's an error, you'll see an error message that can help you troubleshoot the issue.

### Common Issues and Solutions

- **Invalid API Key**: If you see authentication errors, double-check your API keys in the environment variables.
- **Rate Limiting**: Some providers have rate limits for free tiers. If you see rate limit errors, you may need to upgrade your subscription.
- **Model Not Found**: Ensure you're using valid model names for each provider.
- **Network Issues**: Make sure your deployment environment has outbound internet access to reach the AI provider APIs.

By testing each provider, you can ensure that your DeGeNz Lounge application is properly configured to use all the AI models you've enabled.
