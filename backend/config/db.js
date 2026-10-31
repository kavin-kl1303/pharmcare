const mongoose = require('mongoose');

let isReplicaSet = false;

const defaultAtlasUri =
  'mongodb://pharm:kavin@ac-98zb9do-shard-00-00.ggygoka.mongodb.net:27017,ac-98zb9do-shard-00-01.ggygoka.mongodb.net:27017,ac-98zb9do-shard-00-02.ggygoka.mongodb.net:27017/pharmacare?ssl=true&replicaSet=atlas-l9sydc-shard-0&authSource=admin&retryWrites=true&w=majority';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || defaultAtlasUri;
  console.log(`[MongoDB] Connecting to: ${uri.includes('mongodb.net') ? 'MongoDB Atlas (Cloud Cluster)' : uri}`);
  
  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[MongoDB] Connected to database: ${conn.connection.name} @ ${conn.connection.host}:${conn.connection.port || 'Atlas'}`);

    // Check if the connected MongoDB instance supports replica sets / transactions
    try {
      const adminDb = conn.connection.db.admin();
      const serverStatus = await adminDb.serverStatus();
      if (serverStatus.repl && serverStatus.repl.setName) {
        isReplicaSet = true;
        console.log(`[MongoDB] Replica Set detected (${serverStatus.repl.setName}). Full multi-document transactions enabled.`);
      } else {
        isReplicaSet = false;
        console.log(`[MongoDB] Standalone deployment detected. Multi-collection operations will execute with fallback sequential atomicity.`);
      }
    } catch (e) {
      isReplicaSet = false;
      console.log(`[MongoDB] Standalone/unprivileged mode detected (${e.message}). Multi-document fallback enabled.`);
    }

    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[MongoDB] Connection closed successfully on application termination.');
  } catch (err) {
    console.error('[MongoDB] Error during connection teardown:', err);
  }
};

process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDB();
  process.exit(0);
});

/**
 * Reusable helper for running multi-collection operations.
 * If running on Replica Set / Atlas, uses mongoose session transactions.
 * If running on Standalone local MongoDB, executes cleanly with graceful fallback.
 */
const runInTransaction = async (workFn) => {
  if (isReplicaSet) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await workFn(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } else {
    // Standalone fallback: execute without session
    return await workFn(null);
  }
};

module.exports = {
  connectDB,
  closeDB,
  runInTransaction,
  getIsReplicaSet: () => isReplicaSet
};
