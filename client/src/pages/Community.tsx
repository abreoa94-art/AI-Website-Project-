import { useEffect, useState } from 'react'
import type { Project } from '../types'
import { Loader2Icon } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import Footer from '../components/Footer'
import api from '@/configs/axios'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'

type PublishedProjectsResponse = {
    projects: Project[]
}

const Community = () => {
  const [ loading, setLoading ] = useState(true);
 const [ projects, setProjects ] = useState<Project[]>([]);
 const navigate = useNavigate();

 const fetchProjects = async () => {
        setLoading(true)
        try {
            const { data } = await api.get<PublishedProjectsResponse>('/api/project/published');
            setProjects(data.projects ?? []);
        } catch (error) {
            console.log(error);
            const message = isAxiosError(error)
                ? error.response?.data?.message || error.message
                : 'Unable to load published projects.'
            toast.error(message);
        } finally {
            setLoading(false)
        }
 }




useEffect(() => {
  fetchProjects();
}, []);
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
                    <h1 className='text-2xl font-medium text-white'>Published Projects</h1>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6'>
                    {projects.map((project) => (
                        <Link to={`/view/${project.id}`} key={project.id} target='_blank'  className='w-full cursor-pointer bg-gray-900/60 border border-gray-700 rounded-lg overflow-hidden hover:border-indigo-800/80 transition-all duration-300'>
                            {/* Desktop-like mini preview */}
                            <div className='relative w-full bg-gray-900 overflow-hidden border-b border-gray-800 aspect-1200/750'>
                                {project.current_code ? (
                                    <div className='absolute inset-4 rounded-xl overflow-hidden border border-gray-800 bg-black'>
                                        <iframe srcDoc={project.current_code}
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
                                    <div  className='flex flex-wrap justify-between items-center gap-3 mt-6 text-sm'>
                                        <span className='text-gray-400'>{new Date(project.createdAt).toLocaleDateString()}</span>
                                        <div className='flex-1 sm:flex-none'>
                                            <button  className="w-full px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-md  transition-colors flex items-center justify-center gap-2"><span className='bg-gray-200 size-4.5 rounded-full text-black font-semibold flex items-center justify-center'>{project.user?.name?.slice(0,1) }</span>
                                            {project.user?.name}
                                            </button>
                                        </div>

                                    </div>
                                </div>
                               
                        </Link>
                    ))}

                </div>

            </div>
        ) : (
            <div className='flex flex-col items-center justify-center h-[80vh]'> 
            <h1 className='text-3xl font-semibold text-gray-300 text-center'>No published projects yet.</h1>
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

export default Community
