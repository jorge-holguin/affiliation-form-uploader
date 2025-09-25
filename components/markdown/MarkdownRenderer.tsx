"use client"

import React, { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"

type Props = { 
  source?: string;
  filePath?: string;
  hideHeader?: boolean;
}

// Function to fetch markdown content from a file
export async function fetchMarkdownContent(filePath: string): Promise<string> {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch markdown: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error fetching markdown content:', error);
    return '**Error loading content**';
  }
}

export default function MarkdownRenderer({ source, filePath, hideHeader = false }: Props) {
  const [markdownContent, setMarkdownContent] = useState<string>(source || '');
  
  useEffect(() => {
    // If filePath is provided, fetch the content
    if (filePath) {
      fetchMarkdownContent(filePath)
        .then(content => {
          // Remove the header if hideHeader is true
          if (hideHeader) {
            const contentLines = content.split('\n');
            const filteredContent = contentLines
              .filter(line => !line.includes('REGISTRO DE AFILIACIÓN') && !line.includes('ASOLIFA.CSS'))
              .join('\n');
            setMarkdownContent(filteredContent);
          } else {
            setMarkdownContent(content);
          }
        })
        .catch(error => console.error('Error in markdown renderer:', error));
    }
  }, [filePath, hideHeader]);

  return (
    <article className="markdown-content">
      <style jsx global>{`
        /* Custom Markdown Styling */
        .markdown-content {
          font-family: Barlow, sans-serif;
          font-size: 16px;
          line-height: 1.6;
          padding: 40px 50px;
          margin: 0;
          max-width: 100%;
          width: 100%;
          box-sizing: border-box;
          background-color: white;
          border-radius: 8px;

          /* 👇 FIX para evitar desbordes */
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .markdown-content p,
        .markdown-content li,
        .markdown-content blockquote {
          max-width: 95ch;             /* ancho legible */
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: break-word;
        }

        .markdown-content pre {
          background: #2d2d2d;
          border-radius: 4px;
          margin: 0.5em 0;
          padding: 1em;
          overflow-x: auto;
        }

        .markdown-content code {
          font-family: 'Fira Code', Consolas, Monaco, monospace;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: anywhere;
        }

        .markdown-content :not(pre)>code {
          background: #f0f0f0;
          padding: 2px 4px;
          border-radius: 3px;
          color: #e83e8c;
        }

        .markdown-content img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1.5em auto;
          border-radius: 4px;
        }

        .markdown-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1.5em 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .markdown-content th,
        .markdown-content td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }

        .markdown-content th {
          background-color: #f4f4f4;
          font-weight: 600;
        }

        .markdown-content tr:nth-child(even) {
          background-color: #f9f9f9;
        }

        .markdown-content blockquote {
          border-left: 4px solid #3b82f6;
          padding: 0.8em 1.2em;
          margin-left: 0;
          margin-right: 0;
          background-color: #f0f7fa;
          color: #4b5563;
          font-style: italic;
          border-radius: 0 4px 4px 0;
          margin-bottom: 1.5rem;
        }

        .markdown-content h1 {
          font-size: 2.4em;
          color: #1a365d;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 0.5rem;
          margin: 2rem 0 1.5rem;
          text-align: center;
          font-weight: 700;
        }

        .markdown-content h2 {
          font-size: 2em;
          color: #2d3748;
          margin: 2rem 0 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.5rem;
          font-weight: 600;
        }

        .markdown-content h3 {
          font-size: 1.5em;
          color: #4a5568;
          margin: 1.5rem 0 1rem;
          font-weight: 600;
          border-left: 3px solid #3182ce;
          padding-left: 0.75rem;
        }
        
        .markdown-content ul, .markdown-content ol {
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        
        .markdown-content li {
          margin: 0.5rem 0;
        }
        
        .markdown-content hr {
          border: 0;
          height: 1px;
          background: #ddd;
          margin: 2rem 0;
        }
        
        .markdown-content input[type="checkbox"] {
          width: 16px;
          height: 16px;
          margin-right: 8px;
          vertical-align: middle;
          accent-color: #3b82f6;
        }

        /* Estilo para barras de desplazamiento */
        .markdown-content::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .markdown-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .markdown-content::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        
        .markdown-content::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}  // soporta task-lists [ ]
        rehypePlugins={[rehypeRaw]}  // permite el <div style="page-break...">
        components={{
          input: (props) => (
            <input {...props} style={{ width: 16, height: 16, marginRight: 8, verticalAlign: 'middle' }} />
          ),
        }}
      >
        {markdownContent}
      </ReactMarkdown>
    </article>
  )
}
