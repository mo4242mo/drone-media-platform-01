# Advanced Features Guide

This document describes the advanced Azure services integrated into the Drone Media Platform.

## 1. Azure Application Insights

Application Insights provides deep monitoring, diagnostics, and analytics for your application.

### Features Enabled
- **Request Tracking**: All API requests are automatically logged
- **Performance Monitoring**: Response times, failure rates, and throughput metrics
- **Exception Tracking**: Automatic capture of unhandled exceptions
- **Dependency Tracking**: Monitor calls to Cosmos DB and Blob Storage
- **Live Metrics**: Real-time view of application performance
- **Custom Events**: Health check events and custom telemetry

### Setup Instructions

1. **Create Application Insights Resource**
   - In Azure Portal, search "Application Insights"
   - Click "Create"
   - Use the same resource group as other resources
   - Name: `drone-media-insights`

2. **Configure Function App**
   - Go to your Function App
   - Settings → Configuration → Application settings
   - Add: `APPLICATIONINSIGHTS_CONNECTION_STRING` with your connection string

3. **View Analytics**
   - Open Application Insights resource
   - Use "Live Metrics" for real-time monitoring
   - Use "Logs" for KQL queries
   - Use "Performance" for detailed analysis

### Sample KQL Queries

```kusto
// View all requests in the last hour
requests
| where timestamp > ago(1h)
| summarize count() by name, resultCode

// View exceptions
exceptions
| where timestamp > ago(24h)
| project timestamp, message, outerMessage

// View dependency calls
dependencies
| where timestamp > ago(1h)
| summarize avg(duration) by name, target
```

## 2. Azure Cognitive Services (Computer Vision)

The platform integrates Azure Computer Vision API for AI-powered image analysis.

### Features
- **Auto-tagging**: Automatically generate descriptive tags for images
- **Object Detection**: Identify objects within images
- **Description Generation**: AI-generated image descriptions
- **Color Analysis**: Extract dominant colors from images

### Setup Instructions

1. **Create Computer Vision Resource**
   - In Azure Portal, search "Computer Vision"
   - Click "Create"
   - Pricing tier: Free F0 (for development) or Standard S1
   - Region: Same as other resources

2. **Configure Function App**
   - Add these settings to your Function App:
   - `COGNITIVE_ENDPOINT`: Your Computer Vision endpoint URL
   - `COGNITIVE_KEY`: Your Computer Vision key

3. **Using the Analysis API**

```javascript
// POST /api/media/{id}/analyze
// Analyzes an image and stores AI-generated metadata

// Response example:
{
  "success": true,
  "data": {
    "id": "abc-123",
    "aiAnalysis": {
      "analyzedAt": "2025-01-06T12:00:00Z",
      "description": "An aerial view of a forest with a river",
      "confidence": 0.92,
      "tags": [
        { "name": "forest", "confidence": 0.98 },
        { "name": "river", "confidence": 0.95 },
        { "name": "aerial", "confidence": 0.89 }
      ],
      "objects": [
        { "name": "tree", "confidence": 0.97 },
        { "name": "water", "confidence": 0.94 }
      ],
      "colors": {
        "dominantColorForeground": "Green",
        "dominantColorBackground": "Blue",
        "accentColor": "2B6E0F"
      }
    }
  }
}
```

## 3. Health Check Endpoint

The `/api/health` endpoint provides system health status.

### Response

```json
{
  "status": "healthy",
  "timestamp": "2025-01-06T12:00:00Z",
  "version": "1.0.0",
  "services": {
    "api": "running",
    "cosmosDb": "connected",
    "blobStorage": "connected",
    "cognitiveServices": "configured",
    "applicationInsights": "configured"
  }
}
```

### Status Codes
- `200 OK`: All services healthy
- `503 Service Unavailable`: One or more services degraded

## 4. Cost Optimization Tips

### Application Insights
- Use sampling to reduce data ingestion costs
- Set daily cap on data volume
- Archive old data to lower-cost storage

### Cognitive Services
- Use Free tier (F0) for development
- Cache analysis results to avoid repeated calls
- Batch requests when possible

### Best Practices
- Monitor costs in Azure Cost Management
- Set up budget alerts
- Review unused resources regularly

