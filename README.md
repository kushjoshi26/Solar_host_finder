# 🌞 Solar Host – Geospatial Backend System

A high-performance, geospatial-first backend system built with NestJS, featuring real-time GPS tracking, asynchronous messaging, and comprehensive observability.

## 🎯 Key Features

- 🚀 **Fast Nearby Host Discovery** - MongoDB 2dsphere indexing + Redis Geohashing
- 🔄 **Async Messaging** - Redis-based Mock SQS implementation
- ⚡ **Lambda-Style Processing** - Event-driven consumer service
- 📡 **Real-time GPS Tracking** - Socket.io WebSocket connections
- 🔐 **Enterprise Security** - JWT authentication + Redis rate limiting
- 📊 **Full Observability** - Prometheus metrics + Grafana dashboards
- 🐳 **Containerized** - Docker Compose for local development
- 🏢 **Multi-tenant Ready** - Complete data isolation per tenant

## 🏗 System Architecture

```
Client
   │
   ▼
NestJS API (EC2 equivalent)
   │
   ├── MongoDB (2dsphere index)
   ├── Redis (Geohash + Rate Limit + Mock SQS + TTL GPS state)
   ├── Prometheus (metrics scraping)
   └── Grafana (dashboard visualization)

Redis List → Consumer API (Lambda equivalent)
```

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Core Features](#core-features)
- [API Documentation](#api-documentation)
- [Monitoring](#monitoring)
- [AWS Cloud Architecture](#aws-cloud-architecture)
- [CI/CD](#cicd)
- [Multi-Tenancy](#multi-tenancy)

## 🛠 Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- MongoDB
- Redis

## 🚀 Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd solar_host_finder
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start services**
```bash
docker-compose up --build
```

4. **Access the services**

| Service | URL |
|---------|-----|
| API Server | http://localhost:9000 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |
| MongoDB | localhost:27017 |
| Redis | localhost:6379 |

## 🔧 Environment Configuration

Create a `.env` file in the root directory:

```env
# Application
APP_ENV=dev
APP_URL=http://localhost:9000

# JWT Configuration
WEBTOKEN_SECRET_KEY=your_random_secret_key_here
WEBTOKEN_EXPIRATION_TIME=2400

# Database
DB_URL=mongodb://mongo:27017/solarhost

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

### Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_ENV` | Environment mode | `dev` or `prod` |
| `APP_URL` | Application base URL | `http://localhost:9000` |
| `WEBTOKEN_SECRET_KEY` | JWT signing secret | Random string (min 32 chars) |
| `WEBTOKEN_EXPIRATION_TIME` | Token validity in seconds | `2400` (40 minutes) |
| `DB_URL` | MongoDB connection string | `mongodb://mongo:27017/solarhost` |
| `REDIS_HOST` | Redis hostname | `redis` (Docker) or `localhost` |
| `REDIS_PORT` | Redis port | `6379` |

## 🌟 Core Features

### 1. 🌍 Geospatial Search

**Endpoint:** `GET /api/nearby-hosts`

**Features:**
- MongoDB 2dsphere index for geographic queries
- Redis Geohashing for ultra-fast lookups
- Tenant-based data isolation
- Rate limiting protection

**Example Request:**
```bash
curl -X GET "http://localhost:9000/api/nearby-hosts" \
  -H "Authorization: Bearer <token>" \
```

### 2. 📡 GPS Streaming (Socket.io)

**Real-time Location Updates**

- Consultants stream live GPS coordinates via WebSocket
- Location data cached in Redis with 300-second TTL
- Active connection metrics tracked in Prometheus // this is pending 

**Socket Connection:**
```javascript
const socket = io('http://localhost:9000');

socket.emit('location-update', {
  lat: 23.1815,
  lng: 79.9864,
  tenantId: 'MongodbID'
});
```

### 3. 🔄 Messaging System (Mock SQS)

**Redis-Based Queue Implementation**

Simulates AWS SQS using Redis Lists:

```
Producer (API) → RPUSH → Redis List → BLPOP → Consumer (Lambda)
```

**Message Flow:**
1. API pushes notification event to Redis queue
2. Consumer service polls queue (blocking pop)
3. Processes event (e.g., WhatsApp webhook)
4. Implements retry logic on failure

**Event Integrity Strategy:**

- **Retry Mechanism:** Failed webhooks are re-queued with retry count
- **Max Retries:** Configurable limit before DLQ transfer
- **Dead Letter Queue (DLQ):** Failed messages stored for manual inspection
- **Idempotency:** Duplicate detection via message ID

### 4. 🔐 Security

#### JWT Authentication
- Access token validation on protected routes
- Configurable token expiration
- Secure signing with `WEBTOKEN_SECRET_KEY`

#### Rate Limiting
- Redis-backed rate limiter
- Protects `/api/nearby-hosts` from abuse
- Prevents scraping and DDoS attacks
- Configurable limits per tenant

#### Input Validation
- Class-validator DTO validation
- Sanitized query parameters
- JWT backed tenantId validation

## 📊 Monitoring & Observability

### Prometheus Metrics

**Endpoint:** `http://localhost:9000/metrics`

**Key Metrics:**

| Metric | Description |
|--------|-------------|
| `http_request_duration_seconds` | API latency histogram |
| `cache_requests_total{status="hit\|miss"}` | Redis cache performance |
| `socket_active_connections` | WebSocket connection count |

### Grafana Dashboard

**Access:** http://localhost:3001 (admin/admin)

**Dashboard Panels:**
1. **API Latency (p95)** - 95th percentile response times
2. **Cache Hit Ratio** - Redis cache efficiency
3. **Active Socket Connections** - Real-time WebSocket stats

**Import Dashboard:**

1. Open Grafana → Dashboards → Import
2. Paste the following JSON:

```json
{
    "title": "Solar Host System Health",
    "panels": [
        {
            "type": "graph",
            "title": "API Latency (p95)",
            "targets": [
                {
                    "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))"
                }
            ]
        },
        {
            "type": "graph",
            "title": "Cache Hit Ratio",
            "targets": [
                {
                    "expr": "sum(rate(cache_requests_total{status=\"hit\"}[5m])) / sum(rate(cache_requests_total[5m]))"
                }
            ]
        },
        {
            "type": "graph",
            "title": "Active Socket Connections",
            "targets": [
                {
                    "expr": "socket_active_connections"
                }
            ]
        }
    ]
}
```

3. Select **Prometheus** as data source

## ☁️ AWS Cloud Architecture

### Local to AWS Mapping

| Local Component | AWS Equivalent |
|----------------|----------------|
| NestJS App | EC2 / ECS Fargate |
| Redis Queue | AWS SQS |
| Consumer API | AWS Lambda |
| MongoDB | MongoDB Atlas / DocumentDB |
| Prometheus | Amazon Managed Prometheus |
| Grafana | Amazon Managed Grafana |
| Redis Cache | Amazon ElastiCache |
| Docker Compose | ECS / Fargate |
| API Entry | API Gateway |

### Recommended Production Architecture

```
Client
   │
   ▼
API Gateway
   │
   ▼
EC2 (NestJS API)
   │
   ├── ElastiCache (Redis)
   ├── MongoDB Atlas
   ├── SQS
   │      │
   │      ▼
   │   Lambda (Notification Processor)
   │      │
   │      ▼
   │   SNS / WhatsApp Webhook
   │
   ├── CloudWatch Logs
   ├── Prometheus
   └── Grafana
```

## 🔁 CI/CD Flow

```
Developer → GitHub
    │
    ▼
GitHub Actions
    │
    ├── Run Tests
    ├── Build Docker Image
    ├── Push to ECR
    ▼
Deploy to EC2 / ECS
```

**Recommended Pipeline Stages:**
1. Lint & Test
2. Build Docker image
3. Push to Amazon ECR
4. Deploy to ECS/EC2
5. Run smoke tests
6. Notify deployment status

## 🏢 Multi-Tenancy

**Tenant Isolation:**

Every request requires a tenant identifier:
```
User Type in database and JWT signature 
```

**Data Isolation:**
- All database queries filtered by `tenantId`
- Redis keys namespaced by tenant
- No cross-tenant data leakage
- Tenant validation on every request

## 🗄 Technology Stack

- **Framework:** NestJS
- **Database:** MongoDB with Mongoose ODM
- **Cache/Queue:** Redis
- **Real-time:** Socket.io
- **Metrics:** Prometheus
- **Visualization:** Grafana
- **Logging:** Winston (JSON format)
- **Containerization:** Docker & Docker Compose

## 📝 Logging

**Structured Logging with Winston:**

- JSON format for easy parsing
- Compatible with Loki/CloudWatch
- Log levels based on `APP_ENV`
- Request ID tracking
- Error stack traces in development

## 🎯 Assignment Success Criteria

| Requirement | Implementation |
|-------------|----------------|
| Geospatial API | MongoDB 2dsphere + Redis Geohashing |
| Messaging | Redis List (Mock SQS) |
| Security | JWT + Rate Limiting |
| Monitoring | Prometheus + Grafana |
| DevOps | Docker Compose |
| Cloud Mapping | EC2 + SQS + Lambda + API Gateway |

## 📚 API Documentation

For complete API documentation, start the server and visit:
```
http://localhost:9000/api/docs
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Contact the development team

---

**Built with ❤️ using NestJS**