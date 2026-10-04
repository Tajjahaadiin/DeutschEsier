import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import {
  topicsBySection,
  MAX_GRAMMAR_TOPICS,
  type GrammarTopic,
} from '../../../shared/grammarTopics'

export interface GrammarTopicPickerProps {
  selected: string[]
  onChange: (next: string[]) => void
}

/**
 * Pemilih topik tata bahasa B1 (multi-select).
 *
 * Memakai checkbox dan label asli agar bisa dioperasikan keyboard dan dibaca
 * screen reader. Dikelompokkan per seksi taksonomi. Pilihan disimpan di
 * komponen induk supaya tidak hilang saat level CEFR ditukar sementara.
 */
export default function GrammarTopicPicker({ selected, onChange }: GrammarTopicPickerProps) {
  const [open, setOpen] = useState(false)
  const grouped = topicsBySection()

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
      return
    }
    if (selected.length >= MAX_GRAMMAR_TOPICS) return
    onChange([...selected, id])
  }

  const atLimit = selected.length >= MAX_GRAMMAR_TOPICS

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-slate-700">
          Topik Tata Bahasa (B1)
        </label>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <X size={12} /> Hapus semua
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm text-left hover:border-blue-400 transition-colors cursor-pointer"
      >
        <span className={selected.length === 0 ? 'text-slate-400' : 'text-slate-700'}>
          {selected.length === 0
            ? 'Pilih topik (opsional)'
            : `${selected.length} topik dipilih`}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <p className="text-[11px] text-slate-400 mt-1">
        Maksimal {MAX_GRAMMAR_TOPICS} topik. Topik terpilih dipakai untuk dialog dan materi
        grammatik.
      </p>

      {open && (
        <div className="mt-2 max-h-80 overflow-y-auto border border-slate-200 rounded-xl bg-white p-3 space-y-3">
          {[...grouped.entries()].map(([section, topics]) => (
            <div key={section}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                {section}
              </p>
              <div className="space-y-1">
                {topics.map((topic: GrammarTopic) => {
                  const checked = selected.includes(topic.id)
                  return (
                    <label
                      key={topic.id}
                      className={`flex items-start gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                        checked ? 'bg-blue-50' : 'hover:bg-slate-50'
                      } ${!checked && atLimit ? 'opacity-50' : ''}`}
                      title={topic.descriptionId}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!checked && atLimit}
                        onChange={() => toggle(topic.id)}
                        data-testid={`topic-${topic.id}`}
                        aria-label={topic.german}
                        className="mt-0.5 cursor-pointer"
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-slate-700">
                          {topic.german}
                        </span>
                        <span className="block text-[11px] text-slate-500">{topic.nameId}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
