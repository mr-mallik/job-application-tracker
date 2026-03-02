'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, Plus, RefreshCw, Save } from 'lucide-react';
import { ProjectEntry } from '@/components/ProjectEntry';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.user.profile?.projects || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast({ title: 'Error', description: 'Failed to load projects', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profile: { projects },
        }),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Projects saved successfully' });
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to save',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Error', description: 'Failed to save projects', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const addProject = () => {
    setProjects([
      ...projects,
      {
        title: '',
        description: '',
        url: '',
      },
    ]);
  };

  const updateProject = (index, field, value) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  const removeProject = (index) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Showcase your personal and professional projects
          </p>
        </div>
        <Button onClick={addProject} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </Button>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No projects added</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add projects to demonstrate your skills and accomplishments
              </p>
              <Button onClick={addProject} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add First Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project, index) => (
            <ProjectEntry
              key={index}
              project={project}
              onChange={(field, value) => updateProject(index, field, value)}
              onRemove={() => removeProject(index)}
            />
          ))}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-2 pb-6">
        <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
