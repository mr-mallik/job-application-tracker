'use client';

import DocumentEditorPage from '@/components/document/DocumentEditorPage';

export default function DocumentPage({ params }) {
  const { documentId } = params;
  return <DocumentEditorPage documentId={documentId} />;
}
