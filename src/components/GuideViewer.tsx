type Item = { id: string; content: string; order_index: number }
type Section = { id: string; title: string; emoji: string; order_index: number; guide_items: Item[] }

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
          {section.guide_items.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400 italic">Nothing added yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {section.guide_items
                .sort((a, b) => a.order_index - b.order_index)
                .map(item => (
                  <div key={item.id} className="px-5 py-3">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <span className="text-gray-300 mr-2">—</span>{item.content}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
