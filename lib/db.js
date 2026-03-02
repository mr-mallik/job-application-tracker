import { MongoClient } from 'mongodb'

let client
let db

export async function connectToMongo() {
  if (!client) {
    const options = {
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
    
    client = new MongoClient(process.env.MONGO_URL, options)
    await client.connect()
    db = client.db(process.env.DB_NAME || 'job_tracker')
    // 
  }
  return db
}

export async function getCollection(name) {
  const database = await connectToMongo()
  return database.collection(name)
}