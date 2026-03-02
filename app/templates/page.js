'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { parseResumeMarkdown, parseDocumentMarkdown } from '@/lib/pdfParser';
import Loader from '@/components/Loader';

// Dynamically import PDF components
const PDFViewer = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFViewer), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">Loading PDF viewer...</div>
  ),
});

// Import templates
import ATSResumeTemplate from '@/components/pdf-templates/ATSResumeTemplate';
import ModernResumeTemplate from '@/components/pdf-templates/ModernResumeTemplate';
import CreativeResumeTemplate from '@/components/pdf-templates/CreativeResumeTemplate';
import CoverLetterTemplate from '@/components/pdf-templates/CoverLetterTemplate';

export default function TemplatePreviewPage() {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate markdown and parse it
  const resumeMarkdown = `Gulger Mallik
Fullstack Developer | Software Engineer | AI/ML Researcher
[gulgermallik@gmail.com](mailto:gulgermallik@gmail.com)
[linkedin.com/in/mrmallik](https://linkedin.com/in/mrmallik)
[mrmallik.com](https://mrmallik.com)
07767924720

# Summary
A web development professional with 6+ years of experience in software engineering and research, expert in Python and AI/ML. Key achievements include improving workflow automation by ~40% with ATMAS and achieving 39% accuracy in soil carbon estimation for the Tierrasphere UKRI project.

# Experience

## Research Assistant in Applied AI | University of Huddersfiel | Huddersfield, UK | 10/2024 - 10/2025
- Developed hybrid AI/ML models (traditional ML + Graph Neural Networks) to predict soil carbon deposits for a UKRI‑funded project.
- Collaborated with environmental scientists, curating heterogeneous datasets and designing sustainable software architecture.
- Built and deployed a Streamlit‑based research application on Azure, supporting reproducible experimentation.
- Produced technical documentation, user guides, and research reports; contributed to an academic publication in progress.
- Delivered presentations to stakeholders, aligning outputs with research objectives and impact requirements.

## Research Technician | University of Huddersfield | Huddersfield, UK | 04/2024 - 08/2024
- Designed and implemented automation workflows to streamline audit processes, reducing manual effort and error rates.
- Translated complex business logic into robust workflow automation pipelines.
- Leveraged LLM APIs for NLP-based data extraction while ensuring compliance and audit integrity.
- Authored technical documentation and project reports for managers, supporting innovation adoption across the business.
- Improved operational efficiency and supported the organization's digital transformation goals.

## R&D Software Engineer | University of Huddersfield | Huddersfield, UK | 10/2023 - 04/2024
- Improved ATMAS efficiency by 25% through designing automated scheduling and asset management.
- Enhanced operational visibility by integrating real-time sensor data from InfluxDB into ATMAS.
- Automated workflows in ATMAS supporting manufacturing and service industries, increasing process consistency by 30%.
- Advanced 3D object recognition research using machine learning, improving master dataset for identification of objects.

## Software Engineer | Trellissoft Inc | Panaji, India | 03/2022 - 08/2022
- Increased system performance by 25% by extending PHP/Laravel modules and integrating MSSQL databases.
- Developed scalable business applications applying modular architecture principles across various projects.
- Enhanced stakeholder confidence by delivering client demos showcasing automation solutions.

## Software Engineer | Teaminertia Technologies | Panaji, India | 05/2019 - 03/2022
- Delivered CMS, CRM, and PWA solutions automating 3 key business workflows.
- Improved system efficiency by 50% by optimizing backend processes.
- Mentored junior developers and managed agile releases to enhance team productivity.
- Collaborated with multiple clients to ensure technical solutions met operational requirements.

# Education

## Masters in Computing | University of Huddersfield | Huddersfield, UK | 09/2022 - 07/2024
Grade: Distinction

# Projects

## PSM Platform | https://psm.cosmokode.com/
A powerful skills matrix that helps managers identify talent, assign projects, and close skill gaps - all in one beautiful interface. Built in Laravel, React, MySQL DB

## Interview Prep Generator | https://interview-prep-ten-lac.vercel.app/
An AI assistant tool to help you get tailored interview questions and answers. Build in Next JS deployed on vercel

## Blue Ocean Strategy | https://blue-ocean-stratergy.vercel.app/
An app built in NextJS deployed on vercel. Helping business chart thier values agains other businesses.

# Technical Skills
Python • PHP • JavaScript • TypeScript • Laravel • Django • React JS • Next.js • Tailwind CSS • Node JS • Object Oriented Programming • MVC Architecture • Streamlit • Azure • AWS • Git • GitHub • CI/CD • SQL • PostgreSQL • MongoDB • Neo4j • RDF • Graph DB • SPARQL • Data Mining • Data Structures • Regression models • Graph neural network • Deep learning models • Timeseries forecasting

# Achievements
- Peer Commendation Award: Recognized for outstanding contributions and achievement in computing and collaborative research.
- Academic Representative: Represented postgraduate computing students, liaising with faculty to improve academic quality and student experience.
`;

  // Parse markdown into structured data
  const userData = useMemo(() => parseResumeMarkdown(resumeMarkdown), []);

  // Cover letter markdown
  const coverLetterMarkdown = `Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineer position at Sample Company Ltd. With over 6 years of experience in full-stack development and AI/ML research, I am confident in my ability to contribute effectively to your team.

As a Co-founder at Cosmokode Ltd, I have successfully co-built and engineered two major SaaS products from the ground up. My experience spans scalable Laravel-based backends, RESTful API development, and multi-tenant architectures. I have also worked extensively with cloud deployments on Azure and AWS, ensuring high performance and security across all platforms.

My research background includes developing hybrid AI/ML models for environmental science applications, where I achieved significant results in soil carbon prediction using Graph Neural Networks. This combination of practical software engineering and advanced AI/ML expertise positions me uniquely to tackle complex technical challenges.

I am particularly drawn to this opportunity because it aligns perfectly with my passion for building scalable, impactful software solutions. I would welcome the chance to discuss how my experience and skills can contribute to Sample Company Ltd's success.

Thank you for considering my application. I look forward to hearing from you.

Yours sincerely,
Gulger Mallik`;

  const coverLetterData = useMemo(() => parseDocumentMarkdown(coverLetterMarkdown), []);

  const userProfile = {
    name: 'Gulger Mallik',
    email: 'gulgermallik@gmail.com',
    linkedin: 'linkedin.com/in/mrmallik',
    portfolio: 'mrmallik.com',
  };

  if (!mounted) {
    return <Loader message="Loading templates..." />;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Template Style Editor</h1>
            <p className="text-muted-foreground mt-1">
              Preview and test PDF template styles with live data
            </p>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Zoom:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="px-3 py-1 rounded border hover:bg-accent"
              >
                -
              </button>
              <span className="w-16 text-center font-mono">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(150, zoom + 10))}
                className="px-3 py-1 rounded border hover:bg-accent"
              >
                +
              </button>
              <button
                onClick={() => setZoom(100)}
                className="px-3 py-1 rounded border hover:bg-accent text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Template Tabs */}
        <Tabs defaultValue="ats" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ats">ATS Resume</TabsTrigger>
            <TabsTrigger value="modern">Modern Resume</TabsTrigger>
            <TabsTrigger value="creative">Creative Resume</TabsTrigger>
            <TabsTrigger value="cover">Cover Letter</TabsTrigger>
          </TabsList>

          {/* ATS Resume */}
          <TabsContent value="ats" className="mt-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">ATS Resume Template</h2>
              <div className="w-full" style={{ height: '1000px' }}>
                <div className="w-full h-full overflow-auto flex justify-center bg-gray-50">
                  <div style={{ width: `${zoom}%`, minWidth: '595px' }}>
                    <PDFViewer
                      width="100%"
                      height="842"
                      showToolbar={false}
                      className="border-0 rounded shadow-lg"
                    >
                      <ATSResumeTemplate data={userData} />
                    </PDFViewer>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Modern Resume */}
          <TabsContent value="modern" className="mt-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Modern Resume Template</h2>
              <div className="w-full" style={{ height: '1000px' }}>
                <div className="w-full h-full overflow-auto flex justify-center bg-gray-50">
                  <div style={{ width: `${zoom}%`, minWidth: '595px' }}>
                    <PDFViewer
                      width="100%"
                      height="842"
                      showToolbar={false}
                      className="border-0 rounded shadow-lg"
                    >
                      <ModernResumeTemplate data={userData} />
                    </PDFViewer>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Creative Resume */}
          <TabsContent value="creative" className="mt-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Creative Resume Template</h2>
              <div className="w-full" style={{ height: '1000px' }}>
                <div className="w-full h-full overflow-auto flex justify-center bg-gray-50">
                  <div style={{ width: `${zoom}%`, minWidth: '595px' }}>
                    <PDFViewer
                      width="100%"
                      height="842"
                      showToolbar={false}
                      className="border-0 rounded shadow-lg"
                    >
                      <CreativeResumeTemplate data={userData} />
                    </PDFViewer>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Cover Letter */}
          <TabsContent value="cover" className="mt-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Cover Letter Template</h2>
              <div className="w-full" style={{ height: '1000px' }}>
                <div className="w-full h-full overflow-auto flex justify-center bg-gray-50">
                  <div style={{ width: `${zoom}%`, minWidth: '595px' }}>
                    <PDFViewer
                      width="100%"
                      height="842"
                      showToolbar={false}
                      className="border-0 rounded shadow-lg"
                    >
                      <CoverLetterTemplate data={coverLetterData} userProfile={userProfile} />
                    </PDFViewer>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Instructions */}
        <Card className="p-6 bg-muted/50">
          <h3 className="font-semibold mb-2">How to use:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Select a template tab to preview it with your data</li>
            <li>
              Edit template styles in{' '}
              <code className="text-xs bg-background px-1 py-0.5 rounded">
                components/pdf-templates/
              </code>
            </li>
            <li>Changes will hot-reload automatically</li>
            <li>Use zoom controls to inspect details</li>
            <li>All templates use your actual profile data from the database</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
