'use client';

import { use } from 'react';
import DocumentEditorPage from '@/components/document/DocumentEditorPage';

export default function DocumentPage({ params }) {
  const { documentId } = use(params);
  return <DocumentEditorPage documentId={documentId} />;
}
