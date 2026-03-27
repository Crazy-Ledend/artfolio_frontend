import React from 'react';

export function FormattedText({ text, className }: { text: string; className?: string }) {
  if (!text) return null;

  const html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<u>$1</u>');

  return <p className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
