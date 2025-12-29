import type { Message, Project, Version } from '../types'
import { BotIcon, EyeIcon, SendIcon, UserIcon, Loader2Icon, XIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRef, useEffect, useState, useCallback } from 'react'
import type { FormEvent } from 'react'
import api from '@/configs/axios'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'

interface SidebarProps {
    isMenuOpen: boolean
    project: Project
    setProject: (project: Project) => void
    isGenerating: boolean
    setIsGenerating: (isGenerating: boolean) => void
    onCloseMenu?: () => void
}

const getRequestError = (error: unknown) => {
    if (isAxiosError(error)) {
        return error.response?.data?.message || error.message
    }
    if (error instanceof Error) {
        return error.message
    }
    return 'Something went wrong. Please try again.'
}

const Sidebar = ({ isMenuOpen, project, setProject, isGenerating, setIsGenerating, onCloseMenu }: SidebarProps) => {
    const messageRef = useRef<HTMLDivElement>(null)
    const [input, setInput] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchProject = useCallback(async () => {
        try {
            const { data } = await api.get(`/api/users/project/${project.id}`)
            setProject(data.project)
        } catch (error) {
            console.error(error)
            toast.error(getRequestError(error))
        }
    }, [project.id, setProject])

    const handleRollback = async (versionId: string) => {
        const confirmed = window.confirm('Are you sure you want to rollback to this version? This action cannot be undone.')
        if (!confirmed) {
            return
        }

        setIsGenerating(true)
        try {
            const { data } = await api.get(`/api/project/rollback/${project.id}/${versionId}`)
            toast.success(data.message)
            await fetchProject()
        } catch (error) {
            console.error(error)
            toast.error(getRequestError(error))
        } finally {
            setIsGenerating(false)
        }
    }

    const handleRevisions = async (event: FormEvent) => {
        event.preventDefault()
        const message = input.trim()
        if (!message) {
            return
        }

        setIsSubmitting(true)
        setIsGenerating(true)

        let intervalId: ReturnType<typeof setInterval> | undefined

        try {
            intervalId = setInterval(fetchProject, 10000)
            const { data } = await api.post(`/api/project/revision/${project.id}`, {
                message
            })
            toast.success(data.message)
            setInput('')
            await fetchProject()
        } catch (error) {
            console.error(error)
            toast.error(getRequestError(error))
        } finally {
            if (intervalId) {
                clearInterval(intervalId)
            }
            setIsGenerating(false)
            setIsSubmitting(false)
        }
    }

    useEffect(() => {
        if (messageRef.current) {
            messageRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [project.conversation.length, project.versions.length, isGenerating])

    const handleCloseMenu = () => {
        onCloseMenu?.()
    }

    const mobileStateClass = isMenuOpen
        ? 'max-sm:translate-x-0 max-sm:opacity-100 max-sm:pointer-events-auto'
        : 'max-sm:translate-x-full max-sm:opacity-0 max-sm:pointer-events-none'

    return (
        <aside
            className={`h-full sm:max-w-sm w-full transition-all duration-300 ${mobileStateClass} max-sm:fixed max-sm:inset-y-0 max-sm:right-0 max-sm:z-50 max-sm:w-full max-sm:max-w-sm max-sm:ml-auto`}
        >
        <div className='h-full sm:max-w-sm w-full sm:rounded-xl rounded-none max-sm:rounded-l-2xl bg-gray-900 border border-gray-800 transition-all flex flex-col'>
            {onCloseMenu && (
                <div className='sm:hidden flex items-center justify-between border-b border-gray-800 px-4 py-3'>
                    <p className='text-sm font-medium text-gray-200'>Conversation history</p>
                    <button
                        type='button'
                        aria-label='Close conversation panel'
                        onClick={handleCloseMenu}
                        className='p-1 rounded-full bg-gray-800/60 hover:bg-gray-700 transition-colors'
                    >
                        <XIcon className='size-5 text-white' />
                    </button>
                </div>
            )}
            <div className='flex flex-col h-full'>
                <div className='flex-1 overflow-y-auto no-scrollbar px-3 flex flex-col gap-4'>
                    {[...project.conversation, ...project.versions]
                        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                        .map((entry) => {
                            const isMessage = 'content' in entry
                            if (isMessage) {
                                const msg = entry as Message
                                const isUser = msg.role === 'user'
                                return (
                                    <div key={msg.id} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                        {!isUser && (
                                            <div className='w-8 h-8 rounded-full bg-linear-to-br from-indigo-600 to-indigo-700 flex items-center justify-center'>
                                                <BotIcon className='size-5 text-white' />
                                            </div>
                                        )}
                                        <div className={`max-w-[80%] p-2 px-4 rounded-2xl shadow-sm text-sm mt-5 leading-relaxed ${isUser ? 'bg-linear-to-r from-indigo-500 to-indigo-600 text-white rounded-tr-none' : 'rounded-tl-none bg-gray-800 text-gray-100'}`}>
                                            {msg.content}
                                        </div>
                                        {isUser && (
                                            <div className='w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center'>
                                                <UserIcon className='size-5 text-gray-200' />
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            const version = entry as Version
                            return (
                                <div key={version.id} className='w-4/5 mx-auto my-2 p-3 rounded-xl bg-gray-800 text-gray-100 shadow flex flex-col gap-2'>
                                    <div className='text-xs font-medium'>
                                        code updated <br />
                                        <span className='text-gray-500 text-xs font-normal'>{new Date(version.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div className='flex items-center justify-between'>
                                        {project.current_version_index === version.id ? (
                                            <button className='px-3 py-1 rounded-md text-xs bg-gray-700'>Current Version</button>
                                        ) : (
                                            <button onClick={() => handleRollback(version.id)} className='px-3 py-1 rounded-md text-xs bg-indigo-500 hover:bg-indigo-600 text-white'>
                                                Rollback to this version
                                            </button>
                                        )}
                                        <Link target='_blank' to={`/preview/${project.id}?versionId=${version.id}`}>
                                            <EyeIcon className='size-6 p-1 bg-gray-700 hover:bg-indigo-500 transition-colors rounded' />
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}
                    {isGenerating && (
                        <div className='flex items-start gap-3 justify-start'>
                            <div className='w-8 h-8 rounded-full bg-linear-to-br from-indigo-600 to-indigo-700 flex items-center justify-center'>
                                <BotIcon className='size-5 text-white' />
                            </div>
                            <div className='flex gap-1.5 h-full items-end'>
                                <span className='size-2 rounded-full animate-bounce bg-gray-600' style={{ animationDelay: '0s' }} />
                                <span className='size-2 rounded-full animate-bounce bg-gray-600' style={{ animationDelay: '0.2s' }} />
                                <span className='size-2 rounded-full animate-bounce bg-gray-600' style={{ animationDelay: '0.4s' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messageRef} />
                </div>

                <form onSubmit={handleRevisions} className='m-3 relative'>
                    <div className='flex items-center gap-2'>
                        <textarea
                            onChange={(event) => setInput(event.target.value)}
                            value={input}
                            rows={4}
                            placeholder='Describe your website or request changes...'
                            className='flex-1 p-3 rounded-xl resize-none text-sm outline-none ring ring-gray-700 focus:ring-indigo-500 bg-gray-800 text-gray-100 placeholder-gray-400 transition-all'
                            disabled={isGenerating || isSubmitting}
                        />
                        <button
                            type='submit'
                            disabled={isGenerating || isSubmitting || !input.trim()}
                            className='absolute bottom-2.5 right-2.5 rounded-full bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white transition-colors disabled:opacity-60'
                        >
                            {isGenerating || isSubmitting ? (
                                <Loader2Icon className='size-7 p-1.5 animate-spin text-white' />
                            ) : (
                                <SendIcon className='size-7 p-1.5 text-white' />
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </aside>
    )
}

export default Sidebar
