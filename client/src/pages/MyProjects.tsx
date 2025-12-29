import { useCallback, useEffect, useState } from 'react'
import type { Project } from '../types'
import { Loader2Icon, PlusIcon, TrashIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import api from '@/configs/axios'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { isAxiosError } from 'axios'

type ProjectsResponse = {
    projects: Project[]
}

const MyProjects = () => {


 const {data: session, isPending} = authClient.useSession();
 const [ loading, setLoading ] = useState(true);
 const [ projects, setProjects ] = useState<Project[]>([]);
 const navigate = useNavigate();

 const getRequestError = (error: unknown) => {
        if (isAxiosError(error)) {
            return error.response?.data?.message || error.message
        }
        if (error instanceof Error) {
            return error.message
        }
        return 'Something went wrong. Please try again.'
 }

 const fetchProjects = useCallback(async () => {
            setLoading(true)
            try {
                const {data} = await api.get<ProjectsResponse>('/api/users/projects')
                setProjects(data.projects ?? [])
            } catch (error) {
                console.log(error)
                toast.error(getRequestError(error))
            } finally {
                setLoading(false)
            }
 }, [])


 const deleteProject = async (projectId: string) => {
     const confirmDelete = window.confirm('Are you sure you want to delete this project? This action cannot be undone.')
     if(!confirmDelete) return

     try {
        const {data} = await api.delete<{ message?: string }>(`/api/project/${projectId}`)
        setProjects((prev) => prev.filter((project) => project.id !== projectId))
        toast.success(data?.message || 'Project deleted successfully.')
     } catch (error) {
        console.log(error)
        toast.error(getRequestError(error))
     }
 }

useEffect(() => {
        if (isPending) {
            return
        }

        if(!session?.user){
            toast.error('Please login to access your projects.')
            navigate('/')
            setLoading(false)
            return
        }

        fetchProjects()
}, [session?.user, isPending, fetchProjects, navigate])
return (
    <>
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
            <div className='flex items-center justify-center h-[80vh]'>
                <Loader2Icon className='size-7 animate-spin text-indigo-200'/>

            </div>
        ) : projects.length > 0 ? (
            <div className='py-10 min-h-[80vh]'>
                <div className='flex flex-wrap items-center justify-between gap-4 mb-12'>
                    <h1 className='text-2xl font-medium text-white'>My Projects</h1>
                    <button onClick={() => navigate('/')} className='flex items-center gap-2 text-white px-3 sm:px-6 py-1 sm:py-2 rounded bg-linear-to-br from-indigo-500 to-indigo-600 hover:opacity-90 active:scale-95 transition-all'><PlusIcon size={18} />Create New</button>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6'>
                    {projects.map((project) => (
                        <div onClick={() => navigate(`/projects/${project.id}`)} key={project.id}  className='relative group w-full cursor-pointer bg-gray-900/60 border border-gray-700 rounded-lg overflow-hidden shadow-md hover:shadow-indigo-700/30 hover:border-indigo-800/80 transition-all duration-300'>
                            {/* Desktop-like mini preview */}
                            <div className='relative w-full bg-gray-900 overflow-hidden border-b border-gray-800 aspect-1200/750'>
                                {project.current_code ? (
                                    <div className='absolute inset-4 rounded-xl overflow-hidden border border-gray-800 bg-black'>
                                        <iframe
                                            srcDoc={project.current_code}
                                            className='h-115 w-185 origin-top-left scale-[0.35] transform-gpu pointer-events-none'
                                            sandbox='allow-scripts'
                                        />
                                    </div>
                                ) : (
                                    <div className='flex items-center justify-center h-full text-gray-500'>
                                        <p>No preview</p>
                                    </div>
                                )}
                            </div>

                                {/* content */}
                                <div className='p-4 text-white bg-linear-to-b from-transparent group-hover:from-indigo-950 to-transparent transition-colors'>
                                    <div className='flex items-start justify-between gap-3'>
                                        <h2 className='text-lg font-medium line-clamp-2'>{project.name}</h2>
                                        <button className='px-2.5 py-0.5 mt-1 ml-2 text-xs bg-gray-800 border border-gray-700 rounded-full'>Website</button>

                                    </div>
                                    <p className='text-gray-400 mt-1 text-sm line-clamp-2'>{project.initial_prompt}</p>
                                    <div onClick={(e) =>e.stopPropagation() } className='flex flex-wrap gap-3 justify-between items-center mt-6 text-sm'>
                                        <span className='text-gray-400'>{new Date(project.createdAt).toLocaleDateString()}</span>
                                        <div className='flex gap-2 text-white text-sm w-full sm:w-auto'>
                                            <button onClick={() => navigate(`/preview/${project.id}`) } className="flex-1 sm:flex-none px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-md transition-all text-center">Preview</button>
                                            <button onClick={() => navigate(`/projects/${project.id}`) } className="flex-1 sm:flex-none px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-md transition-colors text-center">Open</button>
                                        </div>

                                    </div>
                                </div>
                                <div onClick={e => e.stopPropagation()}>
                                    <TrashIcon className="absolute top-3 right-3 scale-0 group-hover:scale-100 bg-white p-1.5 size-7 rounded text-red-500 text-xl cursor-pointer transition-all"  onClick={() => deleteProject(project.id) }/>
                                </div>
                        </div>
                    ))}

                </div>

            </div>
        ) : (
            <div className='flex flex-col items-center justify-center h-[80vh]'> 
            <h1 className='text-3xl font-semibold text-gray-300'>You have no projects yet!</h1>
            <button onClick={() => navigate('/')} className='text-white px-5 py-2 mt-5 rounded-md bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition-all'>
                Create New
            </button>
            </div>
        )}
    </div>
     <Footer  />
    </>
    )

}

export default MyProjects
