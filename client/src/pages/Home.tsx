import api from '@/configs/axios';
import { authClient } from '@/lib/auth-client';
import { isAxiosError } from 'axios';
import { Loader2Icon } from 'lucide-react';
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type CreateProjectResponse = {
  projectId: string;
};

const Home = () => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const {data: session} = authClient.useSession();
    const navigate = useNavigate();

    const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    try{
      if(!session?.user){
        return toast.error('You must be logged in to create a project.');
      }else if(!input.trim()){
        return toast.error('Please provide a valid description.');
      }
      setLoading(true);
      const {data} = await api.post<CreateProjectResponse>('/api/users/project',{ initial_prompt: input }); 
      setLoading(false);
      navigate(`/projects/${data.projectId}`);


    }catch(err: unknown){
      console.error(err);
      setLoading(false);
      const message = isAxiosError(err)
        ? err.response?.data?.message || err.message
        : err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.';
      toast.error(message);
    }

    
  }

  
  return (
    
   

        
        

      <section className="flex flex-col items-center text-white text-sm pb-20 px-4 font-poppins">
  
          

        <a href="https://prebuiltui.com" className="flex items-center gap-2 border border-slate-700 rounded-full p-1 pr-3 text-sm mt-20">
          <span className="bg-indigo-600 text-xs px-3 py-1 rounded-full">NEW</span>
          <p className="flex items-center gap-2">
            <span>Try 30 days free trial option</span>
            <svg className="mt-px" width="6" height="9" viewBox="0 0 6 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m1 1 4 3.5L1 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </p>
        </a>

        <h1 className="text-center text-[40px] leading-12 md:text-6xl md:leading-17.5 mt-4 font-semibold max-w-3xl">
          Turn thoughts into websites instantly, with AI.
        </h1>

        <p className="text-center text-base max-w-md mt-2">
          Create, customize and publish websites faster than ever with intelligent design powered by AI.
        </p>
        <form onSubmit={onSubmitHandler} className="bg-white/10 max-w-2xl w-full rounded-xl p-4 mt-10 border border-indigo-600/70 focus-within:ring-2 ring-indigo-500 transition-all">
          <textarea value={input} onChange={e => setInput(e.target.value)} className="bg-transparent outline-none text-gray-300 resize-none w-full" rows={4} placeholder="Describe your presentation in details" required />
          <button type="submit" disabled={loading} aria-busy={loading} className="ml-auto flex items-center gap-2 bg-linear-to-r from-[#CB52D4] to-indigo-600 rounded-md px-4 py-2 disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? (
              <>
                Creating <Loader2Icon className='animate-spin size-4 text-white' />
              </>
            ) : (
              'Create with AI'
            )}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-16 md:gap-20 mx-auto mt-16">
          <img className="max-w-28 md:max-w-32" src="https://saasly.prebuiltui.com/assets/companies-logo/framer.svg" alt="" />
          <img className="max-w-28 md:max-w-32" src="https://saasly.prebuiltui.com/assets/companies-logo/huawei.svg" alt="" />
          <img className="max-w-28 md:max-w-32" src="https://saasly.prebuiltui.com/assets/companies-logo/instagram.svg" alt="" />
          <img className="max-w-28 md:max-w-32" src="https://saasly.prebuiltui.com/assets/companies-logo/microsoft.svg" alt="" />
          <img className="max-w-28 md:max-w-32" src="https://saasly.prebuiltui.com/assets/companies-logo/walmart.svg" alt="" />
        </div>
      </section>
  
  ) 
}

export default Home
