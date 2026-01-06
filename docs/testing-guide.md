# Testing Guide

This guide covers how to test the Drone Media Platform locally and in Azure.

## Prerequisites

1. **Azure CLI** installed and logged in
2. **Node.js 18+** installed
3. **Azure Functions Core Tools v4** installed
4. **Azure Resources** created (see azure-setup.md)

## Local Development Setup

### 1. Install Dependencies

```bash
cd drone-media-platform/api
npm install
```

### 2. Configure Local Settings

Create `local.settings.json` in the `api` folder:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_ENDPOINT": "https://your-cosmos.documents.azure.com:443/",
    "COSMOS_KEY": "your-key-here",
    "COSMOS_DATABASE": "DroneMediaDB",
    "COSMOS_CONTAINER": "MediaAssets",
    "STORAGE_CONNECTION_STRING": "your-storage-connection-string",
    "STORAGE_CONTAINER": "media-files"
  },
  "Host": {
    "CORS": "*"
  }
}
```

### 3. Start the Functions Locally

```bash
cd api
func start
```

The API will be available at `http://localhost:7071/api`

### 4. Update Frontend Config

In `frontend/js/config.js`, set:
```javascript
API_BASE_URL: 'http://localhost:7071/api'
```

### 5. Serve Frontend Locally

Use any static file server, e.g.:
```bash
cd frontend
npx serve .
# or
python -m http.server 8080
```

## API Testing

### Using cURL

#### Health Check
```bash
curl http://localhost:7071/api/health
```

#### List Media
```bash
curl http://localhost:7071/api/media
```

#### Get Single Media
```bash
curl http://localhost:7071/api/media/{id}
```

#### Upload Media
```bash
curl -X POST http://localhost:7071/api/media \
  -F "file=@/path/to/image.jpg" \
  -F "title=Test Image" \
  -F "description=A test upload" \
  -F "latitude=54.5973" \
  -F "longitude=-5.9301"
```

#### Update Media
```bash
curl -X PUT http://localhost:7071/api/media/{id} \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title","description":"New description"}'
```

#### Delete Media
```bash
curl -X DELETE http://localhost:7071/api/media/{id}
```

#### Analyze Image (Cognitive Services)
```bash
curl -X POST http://localhost:7071/api/media/{id}/analyze
```

### Using Postman

1. Import the API endpoints listed above
2. Create an environment with `base_url = http://localhost:7071/api`
3. Test each endpoint

## Frontend Testing Checklist

### Gallery Page (index.html)
- [ ] Page loads and displays loading indicator
- [ ] Media items display in grid layout
- [ ] Click on media opens detail modal
- [ ] Search filters results correctly
- [ ] Filter buttons work (All/Images/Videos)
- [ ] Stats bar shows correct totals
- [ ] Empty state shows when no media

### Upload Page (upload.html)
- [ ] Drag and drop works
- [ ] Click to browse works
- [ ] File preview displays correctly
- [ ] Validation rejects invalid files
- [ ] Title field auto-fills from filename
- [ ] "Get Location" button works
- [ ] Upload progress bar displays
- [ ] Success message shows after upload
- [ ] Error messages display properly

### Modal Functions
- [ ] Detail modal displays all info
- [ ] Edit modal pre-fills data
- [ ] Edit saves changes correctly
- [ ] Download button downloads file
- [ ] Delete removes media with confirmation

## Testing in Azure

### 1. Deploy Resources
Follow the azure-setup.md guide to create all resources.

### 2. Deploy Code
Push to GitHub to trigger CI/CD, or deploy manually:

```bash
# Deploy Functions
cd api
func azure functionapp publish drone-media-func

# Deploy Static Web App (via Azure Portal or CLI)
az staticwebapp upload --name drone-media-web --source frontend/
```

### 3. Update Frontend Config
Update `API_BASE_URL` in `config.js` to your Function App URL:
```javascript
API_BASE_URL: 'https://drone-media-func.azurewebsites.net/api'
```

### 4. Test in Browser
Navigate to your Static Web App URL and test all features.

## Common Issues & Solutions

### CORS Errors
- Ensure CORS is configured in Function App
- Check `host.json` has correct CORS settings
- Verify `Access-Control-Allow-Origin` headers in responses

### 404 Not Found
- Check API route configuration
- Verify Function App is running
- Check deployment succeeded

### Authentication Errors
- Verify connection strings are correct
- Check API keys haven't expired
- Ensure all environment variables are set

### Upload Fails
- Check file size limits
- Verify storage container exists
- Check storage account permissions

## Performance Testing

For load testing, use tools like:
- Apache JMeter
- Azure Load Testing
- k6

## Security Checklist

- [ ] Connection strings stored in Azure Key Vault (optional)
- [ ] HTTPS enforced on all endpoints
- [ ] Input validation on all API endpoints
- [ ] File type validation
- [ ] Maximum file size enforced

