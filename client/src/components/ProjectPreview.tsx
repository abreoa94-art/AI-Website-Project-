import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Project } from '../types'
import { iframeScript } from '../assets/assets'
import EditorPanel from './EditorPanel'
import type { EditorSelectedElement, ElementStyles } from './EditorPanel'
import LoaderSteps from './LoaderSteps'

export interface ProjectPreviewRef {
    getCode: () => string | undefined
}

export interface ProjectPreviewProps {
    project: Project
    isGenerating: boolean
    device?: 'phone' | 'tablet' | 'desktop'
    showEditorPanel?: boolean
}

type IframeSelectedElement = {
    tagName: string
    className: string
    text: string
    styles?: Record<string, string>
}

const defaultStyles: ElementStyles = {
    padding: '',
    margin: '',
    color: '',
    backgroundColor: '',
    fontSize: '',
    borderRadius: ''
}

const mapSelectedElement = (payload: IframeSelectedElement): EditorSelectedElement => ({
    tagName: payload.tagName,
    className: payload.className,
    text: payload.text,
    styles: {
        ...defaultStyles,
        ...(payload.styles ?? {})
    }
})

const ProjectPreview = forwardRef<ProjectPreviewRef, ProjectPreviewProps>(
    ({ project, isGenerating, device = 'desktop', showEditorPanel = true }, ref) => {
        const iframeRef = useRef<HTMLIFrameElement>(null)
        const [selectedElement, setSelectedElement] = useState<EditorSelectedElement | null>(null)

        useEffect(() => {
            if (!showEditorPanel) return

            const handleMessage = (event: MessageEvent) => {
                if (!event.data || typeof event.data !== 'object') return

                if (event.data.type === 'ELEMENT_SELECTED') {
                    setSelectedElement(mapSelectedElement(event.data.payload as IframeSelectedElement))
                } else if (event.data.type === 'CLEAR_SELECTION') {
                    setSelectedElement(null)
                }
            }

            window.addEventListener('message', handleMessage)
            return () => window.removeEventListener('message', handleMessage)
        }, [showEditorPanel])

        const postToIframe = (message: Record<string, unknown>) => {
            if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage(message, '*')
            }
        }

        const handleUpdate = (updates: Record<string, unknown>) => {
            postToIframe({ type: 'UPDATE_ELEMENT', payload: updates })
        }

        const handleClosePanel = () => {
            setSelectedElement(null)
            postToIframe({ type: 'CLEAR_SELECTION_REQUEST' })
        }

        useImperativeHandle(
            ref,
            () => ({
                getCode: () => {
                    const doc = iframeRef.current?.contentDocument
                    if (!doc) {
                        return project?.current_code
                    }

                    doc
                        .querySelectorAll('.ai-selected-element, [data-ai-selected]')
                        .forEach((el) => {
                            el.classList.remove('ai-selected-element')
                            el.removeAttribute('data-ai-selected')
                            ;(el as HTMLElement).style.outline = ''
                        })

                    doc.getElementById('ai-preview-style')?.remove()
                    doc.getElementById('ai-preview-script')?.remove()

                    return doc.documentElement?.outerHTML ?? project?.current_code
                }
            }),
            [project?.current_code]
        )

        const injectPreview = (html?: string) => {
            if (!html) return ''
            if (!showEditorPanel) return html

            if (html.includes('</body>')) {
                return html.replace('</body>', `${iframeScript}</body>`)
            }
            return `${html}${iframeScript}`
        }

        const hasCode = Boolean(project.current_code)

        return (
            <div
                className='relative h-full w-full bg-black flex-1 rounded-xl overflow-hidden border border-gray-800'
                data-device={device}
            >
                {hasCode && (
                    <iframe
                        ref={iframeRef}
                        title={`project-preview-${project.id}`}
                        srcDoc={injectPreview(project.current_code)}
                        className='h-full w-full border-0 bg-white'
                    />
                )}

                {isGenerating && (
                   <LoaderSteps />
                )}

                {!hasCode && !isGenerating && (
                    <div className='absolute inset-0 flex items-center justify-center text-sm text-gray-400 bg-black/70'>
                        Preview unavailable
                    </div>
                )}

                {showEditorPanel && selectedElement && (
                    <EditorPanel
                        selectedElement={selectedElement}
                        onUpdate={handleUpdate}
                        onClose={handleClosePanel}
                    />
                )}
            </div>
        )
    }
)

export default ProjectPreview
