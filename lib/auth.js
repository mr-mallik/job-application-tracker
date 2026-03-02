import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { getCollection } from './db'
import nodemailer from 'nodemailer'

const JWT_SECRET = process.env.JWT_SECRET || 'job-tracker-secret-2025'

// Create SMTP transporter
let transporter = null
if (process.env.SMTP_HOST && process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_ENCRYPTION === 'ssl', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD
    }
  })
  // console.log('✉️ SMTP email configured')
} else {
  console.log('⚠️ SMTP not configured - emails will be logged to console')
}

// Helper function to send email
export async function sendEmail(to, subject, text, html) {
  if (!transporter) {
    // Fallback to console logging if SMTP not configured
    console.log('\n==========================================')
    console.log(`📧 EMAIL (Console Mode - SMTP not configured)`)
    console.log('==========================================')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`\n${text}`)
    console.log('==========================================\n')
    return
  }

  try {
    await transporter.sendMail({
      from: `"Job Application Tracker" <${process.env.SMTP_USERNAME}>`,
      to,
      subject,
      text,
      html
    })
    console.log(`✅ Email sent to ${to}: ${subject}`)
  } catch (error) {
    console.error('❌ Failed to send email:', error.message)
    // Fallback to console logging
    console.log('\n==========================================')
    console.log(`📧 EMAIL (Fallback - SMTP failed)`)
    console.log('==========================================')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`\n${text}`)
    console.log('==========================================\n')
  }
}

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
  
  // Send verification email
  const emailText = `Hi ${name},\n\nThank you for registering with Job Application Tracker!\n\nYour verification code is: ${verificationCode}\n\nEnter this code to verify your email address and start tracking your job applications.\n\nBest regards,\nJob Application Tracker Team`
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Welcome to Job Application Tracker!</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for registering! To complete your registration, please verify your email address.</p>
      <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #6B7280;">Your verification code:</p>
        <h1 style="margin: 10px 0; color: #4F46E5; letter-spacing: 3px;">${verificationCode}</h1>
      </div>
      <p>Enter this code to verify your email address and start using Job Application Tracker.</p>
      <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
        Best regards,<br>
        Job Application Tracker Team
      </p>
    </div>
  `
  
  await sendEmail(email, 'Verify your Job Tracker account', emailText, emailHtml)
  
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
  // Basic info
  if (updates.name) allowedUpdates.name = updates.name
  if (updates.designation !== undefined) allowedUpdates.designation = updates.designation
  if (updates.phone !== undefined) allowedUpdates.phone = updates.phone
  if (updates.linkedin !== undefined) allowedUpdates.linkedin = updates.linkedin
  if (updates.portfolio !== undefined) allowedUpdates.portfolio = updates.portfolio
  
  // Resume content
  if (updates.summary !== undefined) allowedUpdates.summary = updates.summary
  if (updates.experiences !== undefined) allowedUpdates.experiences = updates.experiences
  if (updates.education !== undefined) allowedUpdates.education = updates.education
  if (updates.skills !== undefined) allowedUpdates.skills = updates.skills
  if (updates.projects !== undefined) allowedUpdates.projects = updates.projects
  if (updates.interests !== undefined) allowedUpdates.interests = updates.interests
  if (updates.achievements !== undefined) allowedUpdates.achievements = updates.achievements
  if (updates.certifications !== undefined) allowedUpdates.certifications = updates.certifications
  if (updates.location !== undefined) allowedUpdates.location = updates.location
  
  // Legacy field
  if (updates.baseResume !== undefined) allowedUpdates.baseResume = updates.baseResume
  
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
  
  // Send password reset email
  const emailText = `Hi ${user.name},\n\nWe received a request to reset your password for Job Application Tracker.\n\nYour password reset code is: ${resetCode}\n\nThis code expires in 1 hour.\n\nIf you didn't request this reset, please ignore this email.\n\nBest regards,\nJob Application Tracker Team`
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Password Reset Request</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>We received a request to reset your password for Job Application Tracker.</p>
      <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #6B7280;">Your password reset code:</p>
        <h1 style="margin: 10px 0; color: #4F46E5; letter-spacing: 3px;">${resetCode}</h1>
        <p style="margin: 10px 0 0 0; font-size: 13px; color: #EF4444;">⏰ This code expires in 1 hour</p>
      </div>
      <p>Enter this code to reset your password.</p>
      <p style="color: #6B7280; font-size: 14px;">If you didn't request this reset, please ignore this email and your password will remain unchanged.</p>
      <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
        Best regards,<br>
        Job Application Tracker Team
      </p>
    </div>
  `
  
  await sendEmail(email, 'Reset your Job Tracker password', emailText, emailHtml)
  
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

export async function changePassword(userId, currentPassword, newPassword) {
  const users = await getCollection('users')
  
  const user = await users.findOne({ id: userId })
  if (!user) {
    throw new Error('User not found')
  }
  
  const isValid = await verifyPassword(currentPassword, user.password)
  if (!isValid) {
    throw new Error('Current password is incorrect')
  }
  
  const hashedPassword = await hashPassword(newPassword)
  await users.updateOne(
    { id: userId },
    { $set: { password: hashedPassword, updatedAt: new Date() } }
  )
  
  return true
}

export async function deleteUserAccount(userId) {
  const users = await getCollection('users')
  const jobs = await getCollection('jobs')
  
  // Delete all user's jobs first
  await jobs.deleteMany({ userId })
  
  // Delete the user
  const result = await users.deleteOne({ id: userId })
  
  if (result.deletedCount === 0) {
    throw new Error('User not found')
  }
  
  return true
}
