'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Briefcase,
  GraduationCap,
  Code,
  FolderOpen,
  Plus,
  Clock,
  Sparkles,
  RefreshCw,
  FileText,
  Eye,
  Trash2,
  Upload,
  Mail,
  Phone,
  Link2,
  Trophy,
  Heart,
} from 'lucide-react';
import { ExperienceEntry } from './ExperienceEntry';
import { ProjectEntry } from './ProjectEntry';
import { ResumePDFPreview } from './ResumePDFPreview';

export function ProfileEditor({ user, token, onSave, onCancel }) {
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    designation: user.designation || '',
    email: user.email || '',
    phone: user.phone || '',
    linkedin: user.linkedin || '',
    portfolio: user.portfolio || '',
    summary: user.summary || '',
    experiences: user.experiences || [],
    education: user.education || {
      degree: '',
      institution: '',
      location: '',
      grade: '',
      startDate: '',
      endDate: '',
    },
    skills: user.skills || { relevant: '', other: '' },
    projects: user.projects || [],
    interests: user.interests || [],
    achievements: user.achievements || '',
  });
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const fileInputRef = useRef(null);

  const addExperience = () =>
    setProfileData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        { title: '', company: '', location: '', startDate: '', endDate: '', description: '' },
      ],
    }));
  const updateExperience = (i, data) =>
    setProfileData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp, idx) => (idx === i ? data : exp)),
    }));
  const removeExperience = (i) =>
    setProfileData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, idx) => idx !== i),
    }));

  const addProject = () =>
    setProfileData((prev) => ({
      ...prev,
      projects: [...prev.projects, { title: '', url: '', description: '' }],
    }));
  const updateProject = (i, data) =>
    setProfileData((prev) => ({
      ...prev,
      projects: prev.projects.map((p, idx) => (idx === i ? data : p)),
    }));
  const removeProject = (i) =>
    setProfileData((prev) => ({ ...prev, projects: prev.projects.filter((_, idx) => idx !== i) }));

  const addInterest = () =>
    setProfileData((prev) => ({
      ...prev,
      interests: [...prev.interests, { title: '', description: '' }],
    }));

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setParsing(true);
    toast.info('Parsing resume with AI...', { duration: 2000 });

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          // Extract base64 content (remove data URL prefix)
          const base64Content = event.target.result.split(',')[1];

          const res = await fetch('/api/auth/parse-resume', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ base64Content }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          // Merge parsed data with existing profile, preserving user's email
          setProfileData({
            ...data.profileData,
            email: user.email, // Always preserve the authenticated user's email
          });

          // Clear the file input for future uploads
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }

          toast.success('Resume imported successfully! Review and edit the extracted data.');
          setActiveTab('basic');
        } catch (error) {
          console.error('Resume parsing error:', error);
          toast.error(error.message || 'Failed to parse resume');
        } finally {
          setParsing(false);
        }
      };
      reader.onerror = () => {
        toast.error('Failed to read file');
        setParsing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File upload error:', error);
      toast.error(error.message || 'Failed to upload file');
      setParsing(false);
    }
  };

  const sortExperiencesChronologically = () => {
    const sorted = [...profileData.experiences].sort((a, b) => {
      const parseDate = (dateStr) => {
        if (!dateStr || dateStr.toLowerCase() === 'present') return new Date();
        const parts = dateStr.split('/');
        if (parts.length === 2) {
          const monthPart = parts[0].trim();
          const year = parseInt(parts[1]);
          const numericMonth = parseInt(monthPart);
          if (!isNaN(numericMonth)) {
            return new Date(year, numericMonth - 1);
          } else {
            const monthMap = {
              jan: 0,
              feb: 1,
              mar: 2,
              apr: 3,
              may: 4,
              jun: 5,
              jul: 6,
              aug: 7,
              sep: 8,
              oct: 9,
              nov: 10,
              dec: 11,
            };
            const month = monthMap[monthPart.toLowerCase().substring(0, 3)];
            return month !== undefined ? new Date(year, month) : new Date(0);
          }
        }
        return new Date(0);
      };
      return parseDate(b.startDate) - parseDate(a.startDate);
    });
    setProfileData({ ...profileData, experiences: sorted });
    toast.success('Experiences sorted chronologically');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Profile saved!');
      onSave(data.user);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const generatePreviewContent = () => {
    let content = '';
    if (profileData.summary) content += `# SUMMARY\n${profileData.summary}\n\n`;

    const sortedExperiences = [...profileData.experiences].sort((a, b) => {
      const parseDate = (dateStr) => {
        if (!dateStr || dateStr.toLowerCase() === 'present') return new Date();
        const parts = dateStr.split('/');
        if (parts.length === 2) {
          const monthPart = parts[0].trim();
          const year = parseInt(parts[1]);
          const numericMonth = parseInt(monthPart);
          if (!isNaN(numericMonth)) {
            return new Date(year, numericMonth - 1);
          } else {
            const monthMap = {
              jan: 0,
              feb: 1,
              mar: 2,
              apr: 3,
              may: 4,
              jun: 5,
              jul: 6,
              aug: 7,
              sep: 8,
              oct: 9,
              nov: 10,
              dec: 11,
            };
            const month = monthMap[monthPart.toLowerCase().substring(0, 3)];
            return month !== undefined ? new Date(year, month) : new Date(0);
          }
        }
        return new Date(0);
      };
      return parseDate(b.startDate) - parseDate(a.startDate);
    });

    if (sortedExperiences.length > 0) {
      content += `# RELEVANT WORK EXPERIENCE\n`;
      sortedExperiences.forEach((exp) => {
        content += `**${exp.title} | ${exp.company}, ${exp.location} | ${exp.startDate} - ${exp.endDate}**\n`;
        if (exp.description)
          exp.description.split('\n').forEach((line) => {
            if (line.trim()) content += `- ${line.trim()}\n`;
          });
        content += '\n';
      });
    }
    if (profileData.education.degree) {
      content += `# EDUCATION\n**${profileData.education.degree} | ${profileData.education.grade} | ${profileData.education.startDate} - ${profileData.education.endDate}**\n${profileData.education.institution}, ${profileData.education.location}\n\n`;
    }
    if (profileData.skills.relevant || profileData.skills.other) {
      content += `# SKILLS\n`;
      if (profileData.skills.relevant)
        content += `**Relevant Skills**\n${profileData.skills.relevant}\n\n`;
      if (profileData.skills.other) content += `**Other Skills**\n${profileData.skills.other}\n\n`;
    }
    if (profileData.projects.length > 0) {
      content += `# PROJECTS\n`;
      profileData.projects.forEach((proj) => {
        content += `**${proj.title}${proj.url ? ' | ' + proj.url : ''}**\n${proj.description}\n\n`;
      });
    }
    if (profileData.interests.length > 0) {
      content += `# INTERESTS\n`;
      profileData.interests.forEach((int) => {
        content += `**${int.title}**\n${int.description}\n\n`;
      });
    }
    return content;
  };

  return (
    <div className="space-y-6">
      {/* AI Import Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Import Resume with AI
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Upload your PDF resume to auto-populate all fields using AI
              </p>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                size="sm"
                variant="default"
                onClick={() => fileInputRef.current?.click()}
                disabled={parsing}
                className="shadow-sm"
              >
                {parsing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content: Form + Preview */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form Section */}
        <div className="w-full lg:w-1/2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="basic" className="gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Basic</span>
              </TabsTrigger>
              <TabsTrigger value="experience" className="gap-2">
                <Briefcase className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Work</span>
              </TabsTrigger>
              <TabsTrigger value="education" className="gap-2">
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Education</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="gap-2">
                <Code className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Skills</span>
              </TabsTrigger>
              <TabsTrigger value="projects" className="gap-2">
                <FolderOpen className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Projects</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <h3 className="font-semibold text-base flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-primary" />
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-medium">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        className="pl-10"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="designation" className="text-xs font-medium">
                      Designation/Title
                    </Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="designation"
                        placeholder="Senior Software Engineer"
                        className="pl-10"
                        value={profileData.designation}
                        onChange={(e) =>
                          setProfileData({ ...profileData, designation: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-medium">
                        Phone
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="+1 234 567 8900"
                          className="pl-10"
                          value={profileData.phone}
                          onChange={(e) =>
                            setProfileData({ ...profileData, phone: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-medium">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          value={profileData.email}
                          className="pl-10 bg-muted"
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="linkedin" className="text-xs font-medium">
                      LinkedIn Profile
                    </Label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="linkedin"
                        placeholder="https://linkedin.com/in/username"
                        className="pl-10"
                        value={profileData.linkedin}
                        onChange={(e) =>
                          setProfileData({ ...profileData, linkedin: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="portfolio" className="text-xs font-medium">
                      Portfolio Website
                    </Label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="portfolio"
                        placeholder="https://yourportfolio.com"
                        className="pl-10"
                        value={profileData.portfolio}
                        onChange={(e) =>
                          setProfileData({ ...profileData, portfolio: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="summary" className="text-xs font-medium">
                      Professional Summary
                    </Label>
                    <Textarea
                      id="summary"
                      placeholder="A brief overview of your professional background, key skills, and career objectives..."
                      className="min-h-[120px] resize-y"
                      value={profileData.summary}
                      onChange={(e) => setProfileData({ ...profileData, summary: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="experience" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  Work Experience
                </h3>
                <div className="flex gap-2">
                  {profileData.experiences.length > 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={sortExperiencesChronologically}
                      className="shadow-sm"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Sort by Date
                    </Button>
                  )}
                  <Button size="sm" onClick={addExperience} className="shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Experience
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {profileData.experiences.map((exp, i) => (
                  <ExperienceEntry
                    key={i}
                    experience={exp}
                    index={i}
                    onChange={(data) => updateExperience(i, data)}
                    onRemove={() => removeExperience(i)}
                  />
                ))}
                {profileData.experiences.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium mb-1">No experience added</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Add your work history to generate better resumes
                    </p>
                    <Button size="sm" variant="outline" onClick={addExperience}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Experience
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="education" className="space-y-4">
              <div>
                <h3 className="font-semibold text-base flex items-center gap-2 mb-3">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  Education
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="degree" className="text-xs font-medium">
                      Degree Name
                    </Label>
                    <Input
                      id="degree"
                      placeholder="Bachelor of Science in Computer Science"
                      value={profileData.education.degree}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          education: { ...profileData.education, degree: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="institution" className="text-xs font-medium">
                      Institution
                    </Label>
                    <Input
                      id="institution"
                      placeholder="University Name"
                      value={profileData.education.institution}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          education: { ...profileData.education, institution: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="location" className="text-xs font-medium">
                        Location
                      </Label>
                      <Input
                        id="location"
                        placeholder="City, Country"
                        value={profileData.education.location}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            education: { ...profileData.education, location: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="grade" className="text-xs font-medium">
                        Grade/GPA
                      </Label>
                      <Input
                        id="grade"
                        placeholder="3.8/4.0"
                        value={profileData.education.grade}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            education: { ...profileData.education, grade: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="eduStart" className="text-xs font-medium">
                        Start Date
                      </Label>
                      <Input
                        id="eduStart"
                        placeholder="mm/yyyy"
                        value={profileData.education.startDate}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            education: { ...profileData.education, startDate: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="eduEnd" className="text-xs font-medium">
                        End Date
                      </Label>
                      <Input
                        id="eduEnd"
                        placeholder="mm/yyyy"
                        value={profileData.education.endDate}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            education: { ...profileData.education, endDate: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <h3 className="font-semibold text-base flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-primary" />
                  Achievements & Certifications
                </h3>
                <Textarea
                  placeholder="Awards, certifications, honors, publications..."
                  className="min-h-[100px] resize-y"
                  value={profileData.achievements}
                  onChange={(e) => setProfileData({ ...profileData, achievements: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <div>
                <h3 className="font-semibold text-base flex items-center gap-2 mb-3">
                  <Code className="w-4 h-4 text-primary" />
                  Technical Skills
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="relevantSkills" className="text-xs font-medium">
                      Primary Skills (comma separated)
                    </Label>
                    <Textarea
                      id="relevantSkills"
                      placeholder="Python, JavaScript, React, Node.js, MongoDB, AWS..."
                      className="min-h-[100px] resize-y"
                      value={profileData.skills.relevant}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          skills: { ...profileData.skills, relevant: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="otherSkills" className="text-xs font-medium">
                      Secondary/Soft Skills
                    </Label>
                    <Textarea
                      id="otherSkills"
                      placeholder="Leadership, Communication, Project Management, Agile..."
                      className="min-h-[100px] resize-y"
                      value={profileData.skills.other}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          skills: { ...profileData.skills, other: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary" />
                    Interests & Hobbies
                  </h3>
                  <Button size="sm" onClick={addInterest} className="shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Interest
                  </Button>
                </div>
                <div className="space-y-3">
                  {profileData.interests.map((interest, i) => (
                    <Card key={i} className="border-2 hover:border-primary/50 transition-colors">
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Interest Title"
                            className="flex-1"
                            value={interest.title}
                            onChange={(e) => {
                              const ni = [...profileData.interests];
                              ni[i] = { ...interest, title: e.target.value };
                              setProfileData({ ...profileData, interests: ni });
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setProfileData({
                                ...profileData,
                                interests: profileData.interests.filter((_, idx) => idx !== i),
                              })
                            }
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Description"
                          value={interest.description}
                          onChange={(e) => {
                            const ni = [...profileData.interests];
                            ni[i] = { ...interest, description: e.target.value };
                            setProfileData({ ...profileData, interests: ni });
                          }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                  {profileData.interests.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <Heart className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">No interests added yet</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-primary" />
                  Projects
                </h3>
                <Button size="sm" onClick={addProject} className="shadow-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              </div>
              <div className="space-y-3">
                {profileData.projects.map((proj, i) => (
                  <ProjectEntry
                    key={i}
                    project={proj}
                    index={i}
                    onChange={(data) => updateProject(i, data)}
                    onRemove={() => removeProject(i)}
                  />
                ))}
                {profileData.projects.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium mb-1">No projects added</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Showcase your personal or professional work
                    </p>
                    <Button size="sm" variant="outline" onClick={addProject}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Project
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Section */}
        <div className="w-full lg:w-1/2">
          <div className="lg:sticky lg:top-6">
            <div className="mb-4">
              <Label className="flex items-center gap-2 font-semibold text-base">
                <Eye className="w-4 h-4 text-primary" />
                Live Resume Preview
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Preview how your data will appear in generated resumes
              </p>
            </div>
            <div className="border rounded-lg bg-muted/30 p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              <ResumePDFPreview
                content={generatePreviewContent()}
                userProfile={profileData}
                maxPages={2}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <Separator />
      <div className="flex justify-between items-center pt-4">
        <p className="text-xs text-muted-foreground hidden sm:block">
          Changes are saved to your profile and used for all AI-generated documents
        </p>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
