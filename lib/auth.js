import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { getCollection } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'job-tracker-secret-2025'

export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export function generateVerificationCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function createUser(email, password, name) {
  const users = await getCollection('users')
  
  const existingUser = await users.findOne({ email: email.toLowerCase() })
  if (existingUser) {
    throw new Error('Email already registered')
  }
  
  const hashedPassword = await hashPassword(password)
  const verificationCode = generateVerificationCode()
  
  const user = {
    id: uuidv4(),
    email: email.toLowerCase(),
    password: hashedPassword,
    name,
    isVerified: false,
    verificationCode,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  await users.insertOne(user)
  
  // Log verification email to console
  console.log('\n==========================================')
  console.log('📧 EMAIL VERIFICATION (Console Mode)')
  console.log('==========================================')
  console.log(`To: ${email}`)
  console.log(`Subject: Verify your Job Tracker account`)
  console.log(`\nHi ${name},`)
  console.log(`\nYour verification code is: ${verificationCode}`)
  console.log(`\nEnter this code to verify your email address.`)
  console.log('==========================================\n')
  
  const { password: _, verificationCode: __, ...safeUser } = user
  return safeUser
}

export async function verifyUserEmail(email, code) {
  const users = await getCollection('users')
  
  const user = await users.findOne({ email: email.toLowerCase() })
  if (!user) {
    throw new Error('User not found')
  }
  
  if (user.isVerified) {
    throw new Error('Email already verified')
  }
  
  if (user.verificationCode !== code) {
    throw new Error('Invalid verification code')
  }
  
  await users.updateOne(
    { email: email.toLowerCase() },
    { $set: { isVerified: true, verificationCode: null, updatedAt: new Date() } }
  )
  
  return true
}

export async function loginUser(email, password) {
  const users = await getCollection('users')
  
  const user = await users.findOne({ email: email.toLowerCase() })
  if (!user) {
    throw new Error('Invalid email or password')
  }
  
  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    throw new Error('Invalid email or password')
  }
  
  if (!user.isVerified) {
    throw new Error('Please verify your email first')
  }
  
  const token = generateToken(user.id)
  const { password: _, verificationCode: __, ...safeUser } = user
  
  return { user: safeUser, token }
}

export async function getUserFromToken(token) {
  const decoded = verifyToken(token)
  if (!decoded) return null
  
  const users = await getCollection('users')
  const user = await users.findOne({ id: decoded.userId })
  if (!user) return null
  
  const { password: _, verificationCode: __, ...safeUser } = user
  return safeUser
}

export async function updateUserProfile(userId, updates) {
  const users = await getCollection('users')
  
  const allowedUpdates = {}
  if (updates.name) allowedUpdates.name = updates.name
  if (updates.phone) allowedUpdates.phone = updates.phone
  allowedUpdates.updatedAt = new Date()
  
  await users.updateOne(
    { id: userId },
    { $set: allowedUpdates }
  )
  
  const user = await users.findOne({ id: userId })
  const { password: _, verificationCode: __, ...safeUser } = user
  return safeUser
}

export async function resetPasswordRequest(email) {
  const users = await getCollection('users')
  
  const user = await users.findOne({ email: email.toLowerCase() })
  if (!user) {
    // Don't reveal if user exists
    return true
  }
  
  const resetCode = generateVerificationCode()
  await users.updateOne(
    { email: email.toLowerCase() },
    { $set: { resetCode, resetCodeExpiry: new Date(Date.now() + 3600000), updatedAt: new Date() } }
  )
  
  // Log reset email to console
  console.log('\n==========================================')
  console.log('📧 PASSWORD RESET (Console Mode)')
  console.log('==========================================')
  console.log(`To: ${email}`)
  console.log(`Subject: Reset your Job Tracker password`)
  console.log(`\nHi ${user.name},`)
  console.log(`\nYour password reset code is: ${resetCode}`)
  console.log(`\nThis code expires in 1 hour.`)
  console.log('==========================================\n')
  
  return true
}

export async function resetPassword(email, code, newPassword) {
  const users = await getCollection('users')
  
  const user = await users.findOne({ email: email.toLowerCase() })
  if (!user || user.resetCode !== code) {
    throw new Error('Invalid reset code')
  }
  
  if (new Date() > user.resetCodeExpiry) {
    throw new Error('Reset code has expired')
  }
  
  const hashedPassword = await hashPassword(newPassword)
  await users.updateOne(
    { email: email.toLowerCase() },
    { $set: { password: hashedPassword, resetCode: null, resetCodeExpiry: null, updatedAt: new Date() } }
  )
  
  return true
}
