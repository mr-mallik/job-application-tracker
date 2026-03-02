/**
 * Migration script to convert education from single object to array
 * Run with: node migrate-education-to-array.js
 */

import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') })

async function migrateEducation() {
  let client
  
  try {
    console.log('Connecting to MongoDB...')
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    
    const db = client.db(process.env.DB_NAME || 'job_tracker')
    const users = db.collection('users')
    
    console.log('Finding users with non-array education...')
    
    // Find all users where education is not an array
    const usersToUpdate = await users.find({
      education: { $exists: true, $not: { $type: 'array' } }
    }).toArray()
    
    console.log(`Found ${usersToUpdate.length} users to migrate`)
    
    if (usersToUpdate.length === 0) {
      console.log('✅ No migration needed - all users already have array education')
      return
    }
    
    let updated = 0
    for (const user of usersToUpdate) {
      console.log(`\nMigrating user: ${user.email}`)
      console.log('Current education:', JSON.stringify(user.education, null, 2))
      
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
      
      console.log('✅ Migrated to:', JSON.stringify(educationArray, null, 2))
      updated++
    }
    
    console.log(`\n✅ Migration complete! Updated ${updated} users`)
    
    // Also migrate skills from string format to structured format
    console.log('\n---')
    console.log('Checking for string-based skills to migrate...')
    
    const usersWithStringSkills = await users.find({
      $or: [
        { 'skills.relevant': { $type: 'string' } },
        { 'skills.other': { $type: 'string' } }
      ]
    }).toArray()
    
    console.log(`Found ${usersWithStringSkills.length} users with string-based skills`)
    
    if (usersWithStringSkills.length > 0) {
      let skillsUpdated = 0
      for (const user of usersWithStringSkills) {
        console.log(`\nMigrating skills for: ${user.email}`)
        
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
        
        console.log(`✅ Migrated ${technical.length} technical and ${soft.length} soft skills`)
        skillsUpdated++
      }
      
      console.log(`\n✅ Skills migration complete! Updated ${skillsUpdated} users`)
    } else {
      console.log('✅ No skills migration needed')
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log('\nDatabase connection closed')
    }
  }
}

migrateEducation()
