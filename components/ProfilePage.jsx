'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Briefcase, User } from 'lucide-react'
import { ProfileEditor } from './ProfileEditor'
import { ThemeToggle } from './theme-toggle'

export function ProfilePage({ user, token, onBack, onUserUpdate }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
        <div className="container mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="hover:bg-accent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-bold text-lg tracking-tight">Profile & Resume Data</h1>
                  <p className="text-sm text-muted-foreground">Manage your professional information</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-6 py-6">
        <div className="bg-card border rounded-lg shadow-md p-6">
          <ProfileEditor 
            user={user}
            token={token}
            onSave={(updatedUser) => {
              localStorage.setItem('user', JSON.stringify(updatedUser))
              onUserUpdate(updatedUser)
              onBack()
            }}
            onCancel={onBack}
          />
        </div>
      </div>
    </div>
  )
}
