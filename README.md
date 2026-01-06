# Drone Media Sharing Platform

A cloud-native platform for drone pilots and teams to upload, manage, and share drone media (photos, videos) with rich metadata.

## Architecture

- **Frontend**: Azure Static Web Apps (HTML/CSS/JavaScript)
- **Backend**: Azure Functions (Node.js)
- **Storage**: Azure Blob Storage
- **Database**: Azure Cosmos DB (NoSQL API)
- **Monitoring**: Azure Application Insights
- **CI/CD**: GitHub Actions

## Azure Resources Required

| Resource | Name | Purpose |
|----------|------|---------|
| Resource Group | drone-media-rg | Container for all resources |
| Storage Account | dronemediasto | Blob storage for media files |
| Cosmos DB | drone-media-cosmos | Metadata database |
| Function App | drone-media-func | REST API endpoints |
| Static Web App | drone-media-web | Frontend hosting |
| Application Insights | drone-media-insights | Monitoring and logging |

## Setup Instructions

### 1. Create Azure Resources

See [docs/azure-setup.md](docs/azure-setup.md) for detailed instructions.

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Azure connection strings.

### 3. Deploy

Push to the `main` branch to trigger automatic deployment via GitHub Actions.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/media | List all media |
| GET | /api/media/{id} | Get single media |
| POST | /api/media | Upload new media |
| PUT | /api/media/{id} | Update media metadata |
| DELETE | /api/media/{id} | Delete media |

## Local Development

```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Navigate to API folder
cd api

# Install dependencies
npm install

# Start local server
func start
```

## License

MIT License - For educational purposes (Ulster University COM682)

