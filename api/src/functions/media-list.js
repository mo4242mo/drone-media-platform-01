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

app.http('media-list', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'media',
    handler: async (request, context) => {
        context.log('GET /api/media - Listing all media assets');

        try {
            const database = await getDatabase();
            const collection = database.collection('MediaAssets');
            
            // Get all media items sorted by upload date
            const items = await collection
                .find({})
                .sort({ uploadedAt: -1 })
                .toArray();

            context.log(`Found ${items.length} media items`);

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    count: items.length,
                    data: items
                })
            };
        } catch (error) {
            context.error('Error listing media:', error);
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
