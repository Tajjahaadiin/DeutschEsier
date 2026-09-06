import React from 'react'
import { Button } from '../ui/button'

export function SelectionBasket({ count, onGenerate }: { count: number, onGenerate: () => void }) {
  if (count === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-between items-center z-50">
      <div className="max-w-4xl mx-auto w-full flex justify-between items-center">
        <div>
          <h4 className="font-bold text-slate-800">{count} kata terpilih</h4>
          <p className="text-sm text-slate-500">Siap digunakan untuk membuat skenario</p>
        </div>
        <Button onClick={onGenerate} className="px-8">
          Buat Skenario
        </Button>
      </div>
    </div>
  )
}
