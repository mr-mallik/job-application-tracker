/**
 * Migration script to convert education from single object to array
 * Run with: node migrations/migrate-education-to-array.js
 */

const { MongoClient } = require('mongodb')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

async function migrateEducation() {
  let client
  
  try {
    
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    
    const db = client.db(process.env.DB_NAME || 'job_tracker')
    const users = db.collection('users')
    
    
    
    // Find all users where education is not an array
    const usersToUpdate = await users.find({
      education: { $exists: true, $not: { $type: 'array' } }
    }).toArray()
    
    
    
    if (usersToUpdate.length === 0) {
      
      return
    }
    
    let updated = 0
    for (const user of usersToUpdate) {
      
      )
      
      // Convert to array
      const educationArray = [user.education]
      
      await users.updateOne(
        { _id: user._id },
        { 
          $set: { 
            education: educationArray,
            updatedAt: new Date()
          } 
        }
      )
      
      )
      updated++
    }
    
    
    
    // Also migrate skills from string format to structured format
    
    
    
    const usersWithStringSkills = await users.find({
      $or: [
        { 'skills.relevant': { $type: 'string' } },
        { 'skills.other': { $type: 'string' } }
      ]
    }).toArray()
    
    
    
    if (usersWithStringSkills.length > 0) {
      let skillsUpdated = 0
      for (const user of usersWithStringSkills) {
        
        
        const technical = user.skills?.relevant 
          ? user.skills.relevant.split(',').map(s => ({ name: s.trim(), proficiency: 'Intermediate' }))
          : []
        const soft = user.skills?.other
          ? user.skills.other.split(',').map(s => ({ name: s.trim(), proficiency: 'Intermediate' }))
          : []
        
        const structuredSkills = {
          technical,
          soft,
          languages: [],
          other: []
        }
        
        await users.updateOne(
          { _id: user._id },
          { 
            $set: { 
              skills: structuredSkills,
              updatedAt: new Date()
            } 
          }
        )
        
        
        skillsUpdated++
      }
      
      
    } else {
      
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      
    }
  }
}

migrateEducation()
