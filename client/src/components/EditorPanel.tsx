import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

export type ElementStyles = {
  padding: string
  margin: string
  color: string
  backgroundColor: string
  fontSize: string
  borderRadius: string
}

export type EditorSelectedElement = {
  tagName: string
  className: string
  text: string
  styles: ElementStyles
}

interface EditorPanelProps {
  selectedElement: EditorSelectedElement | null
  onUpdate: (updates: Record<string, unknown>) => void
  onClose: () => void
}

type ElementField = 'text' | 'className'
type StyleField = keyof ElementStyles

const toHex = (value: string) => {
  if (!value) {
    return '#000000'
  }
  if (value.toLowerCase() === 'transparent' || value === 'rgba(0, 0, 0, 0)') {
    return '#ffffff'
  }
  if (value.startsWith('#')) {
    return value
  }
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/i)
  if (!match) {
    return '#000000'
  }
  const [r, g, b, a] = match.slice(1)
  if (!r || !g || !b) {
    return '#000000'
  }
  if (a !== undefined && Number(a) === 0) {
    return '#ffffff'
  }
  const toChannelHex = (channel: string) => {
    const hex = Number(channel).toString(16).padStart(2, '0')
    return hex
  }
  return `#${toChannelHex(r)}${toChannelHex(g)}${toChannelHex(b)}`
}
        
    


const EditorPanel = ({ selectedElement, onUpdate, onClose }: EditorPanelProps) => {
  const [values, setValues] = useState<EditorSelectedElement | null>(selectedElement)

useEffect(() => {
    setValues(selectedElement)
},[selectedElement])

if(!selectedElement || !values) return null


const handleChange = (field: ElementField, value: string) => {
  const newValues: EditorSelectedElement = { ...values, [field]: value }
  setValues(newValues)
  onUpdate({ [field]: value })
}

const handleStyleChange = (styleName: StyleField, value: string) => {
  const newStyles: ElementStyles = { ...values.styles, [styleName]: value }
  setValues({ ...values, styles: newStyles })
  onUpdate({ styles: { [styleName]: value } })
}
    return (
    <div className='absolute top-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 animate-fade-in fade-in '>
      <div>
        <h3 className='font-semibold text-gray-800'>Edit Element</h3>
        <button onClick={onClose} className='p-1 hover:bg-gray-100 rounded-full'>
            <X className='w-4 h-4 text-gray-500'/>
        </button>
      </div>
      <div className='space-y-4 text-black'>
        <div>
            <label className='block text-xs font-medium text-gray-500 mb-1'>Text Content</label>
            <textarea 
            value={values.text} 
            onChange={(e) => handleChange('text', e.target.value)} 
            className='w-full text-sm p-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none min-h-20'/>
        </div>
        <div>
            <label className='block text-xs font-medium text-gray-500 mb-1'>Class Name</label>
            <input type='text' 
            value={values.className || ''} 
            onChange={(e) => handleChange('className', e.target.value)} 
            className='w-full text-sm p-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none'/>
        
        </div>
        <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-xs font-medium text-gray-500 mb-1'>Padding</label>
             <input type='text' 
             value={values.styles.padding}
              onChange={(e) => handleStyleChange('padding', e.target.value)} 
              className='w-full text-sm p-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none'/>

            </div>
            <div>
              <label className='block text-xs font-medium text-gray-500 mb-1'>Margin</label>
             <input type='text' 
             value={values.styles.margin}
              onChange={(e) => handleStyleChange('margin', e.target.value)} 
              className='w-full text-sm p-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none'/>

            </div>
        </div>
        <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-xs font-medium text-gray-500 mb-1'>Font Size</label>
             <input type='text' 
             value={values.styles.fontSize}
              onChange={(e) => handleStyleChange('fontSize', e.target.value)} 
              className='w-full text-sm p-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none'/>

            </div>
        </div>
         <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-xs font-medium text-gray-500 mb-1'>Background</label>
              <div className='flex items-center gap-2 border border-gray-400 rounded-md p-1'>
             <input type='color' 
             value={toHex(values.styles.backgroundColor)}
              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)} 
              className='w-6 h-6 cursor-pointer '/>
              <span className='text-xs text-gray-600 truncate'>{values.styles.backgroundColor}</span>

              </div>

            </div>
            <div>
              <label className='block text-xs font-medium text-gray-500 mb-1'>Text Color</label>
              <div className='flex items-center gap-2 border border-gray-400 rounded-md p-1'>
             <input type='color' 
             value={toHex(values.styles.color)}
              onChange={(e) => handleStyleChange('color', e.target.value)} 
              className='w-6 h-6 cursor-pointer '/>
                <span className='text-xs text-gray-600 truncate'>{values.styles.color}</span>
              </div>

            </div>
        </div>

      </div>
    </div>
  )
}

export default EditorPanel
