# Azure Resource Setup Guide

This guide walks you through creating all necessary Azure resources for the Drone Media Platform.

## Prerequisites

- Azure account with active subscription
- Azure CLI installed (optional but recommended)

## Step 1: Create Resource Group

### Via Azure Portal:
1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Resource groups" → Click "Create"
3. Settings:
   - Subscription: Your subscription
   - Resource group: `drone-media-rg`
   - Region: `UK South` (or your preferred region)
4. Click "Review + create" → "Create"

### Via Azure CLI:
```bash
az group create --name drone-media-rg --location uksouth
```

## Step 2: Create Storage Account

### Via Azure Portal:
1. Search for "Storage accounts" → Click "Create"
2. Basics:
   - Resource group: `drone-media-rg`
   - Storage account name: `dronemediasto` (must be globally unique, add random suffix if taken)
   - Region: Same as resource group
   - Performance: Standard
   - Redundancy: LRS (Locally-redundant storage)
3. Click "Review + create" → "Create"

### Create Blob Container:
1. Open the storage account
2. Go to "Containers" under "Data storage"
3. Click "+ Container"
4. Name: `media-files`
5. Public access level: Blob (anonymous read access for blobs only)
6. Click "Create"

### Enable CORS:
1. Go to "Resource sharing (CORS)" under "Settings"
2. Add a rule:
   - Allowed origins: `*`
   - Allowed methods: GET, POST, PUT, DELETE, OPTIONS
   - Allowed headers: `*`
   - Exposed headers: `*`
   - Max age: 3600
3. Click "Save"

### Via Azure CLI:
```bash
# Create storage account
az storage account create \
  --name dronemediasto \
  --resource-group drone-media-rg \
  --location uksouth \
  --sku Standard_LRS

# Get connection string
az storage account show-connection-string \
  --name dronemediasto \
  --resource-group drone-media-rg

# Create container
az storage container create \
  --name media-files \
  --account-name dronemediasto \
  --public-access blob
```

## Step 3: Create Cosmos DB Account

### Via Azure Portal:
1. Search for "Azure Cosmos DB" → Click "Create"
2. Select "Azure Cosmos DB for NoSQL"
3. Basics:
   - Resource group: `drone-media-rg`
   - Account Name: `drone-media-cosmos` (must be globally unique)
   - Location: Same as resource group
   - Capacity mode: Serverless (cost-effective for development)
4. Click "Review + create" → "Create"

### Create Database and Container:
1. Open the Cosmos DB account
2. Go to "Data Explorer"
3. Click "New Container"
4. Database id: `DroneMediaDB` (Create new)
5. Container id: `MediaAssets`
6. Partition key: `/id`
7. Click "OK"

### Via Azure CLI:
```bash
# Create Cosmos DB account
az cosmosdb create \
  --name drone-media-cosmos \
  --resource-group drone-media-rg \
  --capabilities EnableServerless

# Create database
az cosmosdb sql database create \
  --account-name drone-media-cosmos \
  --resource-group drone-media-rg \
  --name DroneMediaDB

# Create container
az cosmosdb sql container create \
  --account-name drone-media-cosmos \
  --resource-group drone-media-rg \
  --database-name DroneMediaDB \
  --name MediaAssets \
  --partition-key-path "/id"
```

## Step 4: Create Function App

### Via Azure Portal:
1. Search for "Function App" → Click "Create"
2. Basics:
   - Resource group: `drone-media-rg`
   - Function App name: `drone-media-func` (must be globally unique)
   - Runtime stack: Node.js
   - Version: 18 LTS
   - Region: Same as resource group
   - Operating System: Windows
   - Hosting plan: Consumption (Serverless)
3. Storage: Use existing `dronemediasto`
4. Monitoring: Enable Application Insights
   - Application Insights name: `drone-media-insights`
5. Click "Review + create" → "Create"

### Configure App Settings:
1. Open the Function App
2. Go to "Configuration" under "Settings"
3. Add the following Application settings:
   - `COSMOS_ENDPOINT`: Your Cosmos DB URI
   - `COSMOS_KEY`: Your Cosmos DB Primary Key
   - `COSMOS_DATABASE`: DroneMediaDB
   - `COSMOS_CONTAINER`: MediaAssets
   - `STORAGE_CONNECTION_STRING`: Your Storage Account connection string
   - `STORAGE_CONTAINER`: media-files
4. Click "Save"

### Via Azure CLI:
```bash
# Create Function App
az functionapp create \
  --name drone-media-func \
  --resource-group drone-media-rg \
  --consumption-plan-location uksouth \
  --runtime node \
  --runtime-version 18 \
  --storage-account dronemediasto \
  --functions-version 4
```

## Step 5: Create Static Web App

### Via Azure Portal:
1. Search for "Static Web Apps" → Click "Create"
2. Basics:
   - Resource group: `drone-media-rg`
   - Name: `drone-media-web`
   - Plan type: Free
   - Region: Same as resource group
   - Source: GitHub
3. Connect your GitHub account and select repository
4. Build Details:
   - Build Presets: Custom
   - App location: `/drone-media-platform/frontend`
   - Api location: `/drone-media-platform/api`
   - Output location: (leave empty)
5. Click "Review + create" → "Create"

## Step 6: Get Connection Strings

### Storage Account Connection String:
1. Open Storage Account → "Access keys"
2. Copy "Connection string" under key1

### Cosmos DB Connection String:
1. Open Cosmos DB Account → "Keys"
2. Copy "URI" and "PRIMARY KEY"

## Summary of Created Resources

After completing all steps, you should have:

- ✅ Resource Group: `drone-media-rg`
- ✅ Storage Account: `dronemediasto`
  - ✅ Container: `media-files`
- ✅ Cosmos DB: `drone-media-cosmos`
  - ✅ Database: `DroneMediaDB`
  - ✅ Container: `MediaAssets`
- ✅ Function App: `drone-media-func`
- ✅ Static Web App: `drone-media-web`
- ✅ Application Insights: `drone-media-insights`

## Next Steps

1. Update the `.env` file with your connection strings
2. Deploy the code via GitHub Actions
3. Test the API endpoints
4. Access your Static Web App URL

