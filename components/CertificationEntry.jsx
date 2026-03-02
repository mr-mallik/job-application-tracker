'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Award, Building2, Calendar, Hash, Link2, X } from 'lucide-react';

export function CertificationEntry({ certification, onChange, onRemove }) {
  return (
    <Card className="relative border-2 hover:border-primary/50 transition-all duration-200">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-base">{certification.name || 'New Certification'}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Certification Name */}
          <div className="space-y-2 md:col-span-2">
            <Label>Certification Name *</Label>
            <div className="relative">
              <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={certification.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder="AWS Certified Solutions Architect"
                className="pl-10"
              />
            </div>
          </div>

          {/* Issuing Organization */}
          <div className="space-y-2">
            <Label>Issuing Organization *</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={certification.issuer}
                onChange={(e) => onChange('issuer', e.target.value)}
                placeholder="Amazon Web Services"
                className="pl-10"
              />
            </div>
          </div>

          {/* Issue Date */}
          <div className="space-y-2">
            <Label>Issue Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="month"
                value={certification.issueDate}
                onChange={(e) => onChange('issueDate', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label>Expiry Date (if applicable)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="month"
                value={certification.expiryDate || ''}
                onChange={(e) => onChange('expiryDate', e.target.value)}
                className="pl-10"
                placeholder="Leave blank if no expiry"
              />
            </div>
          </div>

          {/* Credential ID */}
          <div className="space-y-2">
            <Label>Credential ID</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={certification.credentialId || ''}
                onChange={(e) => onChange('credentialId', e.target.value)}
                placeholder="ABC123XYZ"
                className="pl-10"
              />
            </div>
          </div>

          {/* Credential URL */}
          <div className="space-y-2 md:col-span-2">
            <Label>Credential URL</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={certification.credentialUrl || ''}
                onChange={(e) => onChange('credentialUrl', e.target.value)}
                placeholder="https://verify.example.com/credentials/abc123"
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Tip: Include verification links to add credibility to your profile
        </p>
      </CardContent>
    </Card>
  );
}
