const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

// Cosmos DB connection
let cosmosClient = null;
let container = null;

async function getContainer() {
    if (!container) {
        const endpoint = process.env.COSMOS_ENDPOINT;
        const key = process.env.COSMOS_KEY;
        
        if (!endpoint || !key) {
            throw new Error('COSMOS_ENDPOINT and COSMOS_KEY environment variables must be set');
        }
        
        cosmosClient = new CosmosClient({ endpoint, key });
        const database = cosmosClient.database('DroneMediaDB');
        container = database.container('media');
    }
    return container;
}

/**
 * Advanced Feature: Image Analysis using Azure Cognitive Services
 * This function analyzes an image and returns AI-generated tags, description, and objects detected
 * 
 * To enable this feature:
 * 1. Create a Computer Vision resource in Azure Portal
 * 2. Add COGNITIVE_ENDPOINT and COGNITIVE_KEY to Function App settings
 * 3. Ensure 'axios' is installed: npm install axios
 */
app.http('media-analyze', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'media/{id}/analyze',
    handler: async (request, context) => {
        const id = request.params.id;
        context.log(`POST /api/media/${id}/analyze - Analyzing media asset`);

        const cognitiveEndpoint = process.env.COGNITIVE_ENDPOINT;
        const cognitiveKey = process.env.COGNITIVE_KEY;

        if (!cognitiveEndpoint || !cognitiveKey) {
            return {
                status: 500,
                jsonBody: {
                    message: 'Cognitive Services endpoint or key is not configured.'
                }
            };
        }

        try {
            const mediaContainer = await getContainer();
            const { resource: mediaItem } = await mediaContainer.item(id, id).read();

            if (!mediaItem) {
                return {
                    status: 404,
                    jsonBody: {
                        message: `Media asset with id ${id} not found`
                    }
                };
            }

            if (!mediaItem.fileUrl) {
                return {
                    status: 400,
                    jsonBody: {
                        message: 'Media item does not have a file URL for analysis.'
                    }
                };
            }

            const axios = require('axios');
            const imageUrl = mediaItem.fileUrl;

            const response = await axios.post(
                `${cognitiveEndpoint}/vision/v3.2/analyze?visualFeatures=Description,Tags,Objects&details=Landmarks&language=en`,
                { url: imageUrl },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Ocp-Apim-Subscription-Key': cognitiveKey
                    }
                }
            );

            const analysisResult = response.data;

            // Update media item with analysis results
            const updatedItem = {
                ...mediaItem,
                analysis: {
                    description: analysisResult.description?.captions?.[0]?.text || '',
                    tags: analysisResult.tags?.map(tag => tag.name) || [],
                    objects: analysisResult.objects?.map(obj => obj.object) || [],
                    raw: analysisResult
                },
                lastAnalyzedDate: new Date().toISOString()
            };

            await mediaContainer.item(id, id).replace(updatedItem);

            return {
                jsonBody: {
                    message: 'Media analyzed successfully',
                    analysis: analysisResult
                }
            };
        } catch (error) {
            context.error(`Error analyzing media asset: ${error.message}`);
            return {
                status: 500,
                jsonBody: {
                    message: 'Error analyzing media asset',
                    error: error.message
                }
            };
        }
    }
});
