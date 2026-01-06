const { app } = require('@azure/functions');
const { MongoClient } = require('mongodb');

// MongoDB connection
let client = null;
let db = null;

async function getDatabase() {
    if (!db) {
        const connectionString = process.env.COSMOS_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error('COSMOS_CONNECTION_STRING environment variable is not set');
        }
        client = new MongoClient(connectionString);
        await client.connect();
        db = client.db('DroneMediaDB');
    }
    return db;
}

/**
 * Advanced Feature: Image Analysis using Azure Cognitive Services
 * This function analyzes an image and returns AI-generated tags, description, and objects detected
 * 
 * To enable this feature:
 * 1. Create a Computer Vision resource in Azure Portal
 * 2. Add COGNITIVE_ENDPOINT and COGNITIVE_KEY to Function App settings
 */
app.http('media-analyze', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'media/{id}/analyze',
    handler: async (request, context) => {
        const id = request.params.id;
        context.log(`POST /api/media/${id}/analyze - Analyzing media with Cognitive Services`);

        try {
            // Check if Cognitive Services is configured
            const cognitiveEndpoint = process.env.COGNITIVE_ENDPOINT;
            const cognitiveKey = process.env.COGNITIVE_KEY;

            if (!cognitiveEndpoint || !cognitiveKey) {
                return {
                    status: 503,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Cognitive Services not configured. Please add COGNITIVE_ENDPOINT and COGNITIVE_KEY to app settings.'
                    })
                };
            }

            // Get the media item
            const database = await getDatabase();
            const collection = database.collection('MediaAssets');
            const item = await collection.findOne({ id: id });

            if (!item) {
                return {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Media not found'
                    })
                };
            }

            // Check if it's an image
            if (!item.fileType.startsWith('image/')) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Analysis is only available for images'
                    })
                };
            }

            // Call Computer Vision API
            const analyzeUrl = `${cognitiveEndpoint}/vision/v3.2/analyze?visualFeatures=Categories,Description,Tags,Objects,Color`;
            
            const analysisResponse = await fetch(analyzeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': cognitiveKey
                },
                body: JSON.stringify({
                    url: item.blobUrl
                })
            });

            if (!analysisResponse.ok) {
                const errorBody = await analysisResponse.text();
                throw new Error(`Cognitive Services error: ${errorBody}`);
            }

            const analysisResult = await analysisResponse.json();

            // Prepare AI analysis data
            const aiAnalysis = {
                analyzedAt: new Date().toISOString(),
                description: analysisResult.description?.captions?.[0]?.text || '',
                confidence: analysisResult.description?.captions?.[0]?.confidence || 0,
                tags: analysisResult.tags?.map(t => ({ name: t.name, confidence: t.confidence })) || [],
                categories: analysisResult.categories?.map(c => ({ name: c.name, score: c.score })) || [],
                objects: analysisResult.objects?.map(o => ({ 
                    name: o.object, 
                    confidence: o.confidence,
                    rectangle: o.rectangle 
                })) || [],
                colors: {
                    dominantColorForeground: analysisResult.color?.dominantColorForeground,
                    dominantColorBackground: analysisResult.color?.dominantColorBackground,
                    dominantColors: analysisResult.color?.dominantColors,
                    accentColor: analysisResult.color?.accentColor
                }
            };

            // Update item in MongoDB
            await collection.updateOne(
                { id: id },
                { 
                    $set: { 
                        aiAnalysis: aiAnalysis,
                        updatedAt: new Date().toISOString()
                    } 
                }
            );

            context.log(`Media analyzed successfully: ${id}`);

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    message: 'Media analyzed successfully',
                    data: {
                        id: id,
                        aiAnalysis: aiAnalysis
                    }
                })
            };
        } catch (error) {
            context.error('Error analyzing media:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: error.message
                })
            };
        }
    }
});
