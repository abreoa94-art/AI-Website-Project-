import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'
import ProjectPreview from '../components/ProjectPreview'
import type { Project, Version } from '../types'
import api from '@/configs/axios'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { isAxiosError } from 'axios'

type PreviewResponse = {
  project_code?: string
  project?: Project & { versions: Version[] }
}

const Preview = () => {
  const { data: session, isPending } = authClient.useSession()
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const versionId = searchParams.get('versionId')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) {
      setError('Invalid project link.')
      setLoading(false)
      return
    }

    if (isPending) {
      return
    }

    if (!session?.user) {
      setError('Please sign in to view this preview.')
      setLoading(false)
      return
    }

    const fetchCode = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data } = await api.get<PreviewResponse>(`/api/project/preview/${projectId}`)
        let resolvedCode: string | undefined = data.project_code ?? data.project?.current_code

        if (versionId && data.project?.versions?.length) {
          const matchedVersion = data.project.versions.find((version) => version.id === versionId)
          if (matchedVersion?.code) {
            resolvedCode = matchedVersion.code
          }
        }

        if (!resolvedCode) {
          throw new Error('Missing project code.')
        }

        setCode(resolvedCode)
      } catch (previewError) {
        console.error(previewError)
        const message = isAxiosError(previewError)
          ? previewError.response?.data?.message || previewError.message
          : 'Unable to load project preview.'
        toast.error(message)
        setError('Unable to load project preview.')
      } finally {
        setLoading(false)
      }
    }

    fetchCode()
  }, [projectId, session?.user, isPending, versionId])

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

export default Preview
