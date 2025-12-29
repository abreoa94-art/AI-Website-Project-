import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'
import ProjectPreview from '../components/ProjectPreview'
import type { Project } from '../types'
import api from '@/configs/axios'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'

const View = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) {
      setError('Invalid project link.')
      setLoading(false)
      return
    }

    const fetchPublishedCode = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data } = await api.get(`/api/project/published/${projectId}`)
        const projectCode = data?.project_code ?? data?.code
        if (!projectCode) {
          throw new Error('Missing project code.')
        }

        setCode(projectCode)
      } catch (fetchError) {
        console.error(fetchError)
        const message = isAxiosError(fetchError)
          ? fetchError.response?.data?.message || fetchError.message
          : 'Unable to load published project.'
        toast.error(message)
        setError('Unable to load published project.')
      } finally {
        setLoading(false)
      }
    }

    fetchPublishedCode()
  }, [projectId])

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader2Icon className='size-7 animate-spin text-indigo-200' />
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center h-screen text-center'>
        <p className='text-lg text-gray-200'>{error}</p>
      </div>
    )
  }

  if (!code) {
    return null
  }

  const previewProject: Project = {
    id: projectId ?? 'preview-id',
    name: 'Project Preview',
    initial_prompt: '',
    current_code: code,
    createdAt: '',
    updatedAt: '',
    userId: '',
    conversation: [],
    versions: [],
    current_version_index: ''
  }

  return (
    <div className='h-screen'>
      <ProjectPreview project={previewProject} isGenerating={false} showEditorPanel={false} />
    </div>
  )
}

export default View
