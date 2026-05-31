'use client'

import ReactMarkdown from 'react-markdown'

type Section = {
  id: string
  title: string
  emoji: string
  order_index: number
  body?: string | null
  video_url?: string | null
}

export default function GuideViewer({ sections }: { sections: Section[] }) {
  if (sections.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <p className="text-3xl mb-3">📖</p>
        <p className="font-medium text-gray-700">Nothing here yet</p>
        <p className="text-sm text-gray-400 mt-1">The farm guide is being put together.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sections.map(section => (
        <div key={section.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 bg-gray-50 border-b border-gray-100">
            <span>{section.emoji}</span>
            <h3 className="font-semibold text-gray-900">{section.title}</h3>
          </div>
          <div className="px-5 py-4 space-y-4">
            {section.body ? (
              <div className="prose prose-sm max-w-none text-gray-700
                prose-p:my-1 prose-p:leading-relaxed
                prose-ul:my-1 prose-ul:pl-5 prose-ul:list-disc
                prose-ol:my-1 prose-ol:pl-5 prose-ol:list-decimal
                prose-li:my-0.5
                prose-strong:font-semibold prose-strong:text-gray-900
                prose-em:italic
                prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800">
                <ReactMarkdown>{section.body}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Nothing added yet.</p>
            )}
            {section.video_url && (
              <div className="rounded-xl overflow-hidden aspect-video bg-black">
                <iframe
                  src={section.video_url.replace('/view', '/preview').replace(/\?.*$/, '')}
                  className="w-full h-full"
                  allow="autoplay"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
