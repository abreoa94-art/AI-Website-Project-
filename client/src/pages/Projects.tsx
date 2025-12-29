import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Project } from '../types';
import {
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  MessageSquareIcon,
  MonitorIcon,
  SaveIcon,
  SmartphoneIcon,
  TabletIcon,
  XIcon,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ProjectPreview, { type ProjectPreviewRef } from '../components/ProjectPreview';
import api from '@/configs/axios';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { isAxiosError } from 'axios';

type Device = 'phone' | 'tablet' | 'desktop';

type DeviceOption = {
  id: Device;
  label: string;
  icon: typeof SmartphoneIcon;
};

const deviceOptions: DeviceOption[] = [
  { id: 'phone', label: 'Phone', icon: SmartphoneIcon },
  { id: 'tablet', label: 'Tablet', icon: TabletIcon },
  { id: 'desktop', label: 'Desktop', icon: MonitorIcon },
];

const previewDimensions: Record<Device, { width: number; height: number }> = {
  phone: { width: 390, height: 780 },
  tablet: { width: 834, height: 1112 },
  desktop: { width: 1280, height: 720 },
};

const getRequestError = (error: unknown) => {
  if (isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
};

const Projects = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [device, setDevice] = useState<Device>('desktop');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const previewRef = useRef<ProjectPreviewRef>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      return;
    }
    try {
      const { data } = await api.get<{ project: Project }>(`/api/users/project/${projectId}`);
      setProject(data.project);
      setIsGenerating(!data.project?.current_code);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error(getRequestError(error));
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    if (isPending) {
      return;
    }

    if (!session?.user) {
      toast.error('Please sign in to access your projects.');
      navigate('/');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchProject();
  }, [projectId, session?.user, isPending, fetchProject, navigate]);

  useEffect(() => {
    if (!project || project.current_code) {
      return;
    }

    const intervalId = setInterval(fetchProject, 10000);
    return () => clearInterval(intervalId);
  }, [project, fetchProject]);

  const saveProject = async () => {
    if (!projectId || !previewRef.current || isSaving) {
      return;
    }

    const updatedCode = previewRef.current.getCode();
    if (!updatedCode) {
      toast.error('No code available to save.');
      return;
    }

    setIsSaving(true);

    try {
      const { data } = await api.put(`/api/project/save/${projectId}`, { code: updatedCode });
      if (data?.message) {
        toast.success(data.message);
      }

      setProject((prev) =>
        prev
          ? {
              ...prev,
              current_code: updatedCode,
              updatedAt: new Date().toISOString(),
            }
          : prev,
      );
      setIsGenerating(false);
    } catch (error) {
      console.error(error);
      toast.error(getRequestError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const downloadCode = () => {
    const code = previewRef.current?.getCode() ?? project?.current_code;
    if (!code) {
      toast.error('No code available to download.');
      return;
    }

    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'index.html';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const togglePublish = async () => {
    if (!projectId || !project) {
      return;
    }

    try {
      const { data } = await api.patch(`/api/users/publish-toggle/${projectId}`);
      if (data?.message) {
        toast.success(data.message);
      }

      setProject((prev) =>
        prev
          ? {
              ...prev,
              isPublished: !prev.isPublished,
            }
          : prev,
      );
    } catch (error) {
      console.error(error);
      toast.error(getRequestError(error));
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader2Icon className='size-7 animate-spin text-violet-200' />
      </div>
    );
  }

  if (!project) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <p className='text-2xl font-medium text-gray-200'>Unable to load project!</p>
      </div>
    );
  }

  const { width, height } = previewDimensions[device];
  const previewStyle = {
    aspectRatio: width / height,
    maxWidth: `${width}px`,
    width: '100%',
    maxHeight: '100%'
  } as const

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <div className='flex flex-col min-h-screen w-full bg-gray-900 text-white'>
      <div className='flex max-sm:flex-col sm:items-center gap-4 px-4 py-3 border-b border-gray-800'>
        <div className='flex items-center gap-2 sm:min-w-56 text-nowrap'>
          <img
            src='/favicon.svg'
            alt='logo'
            className='h-6 cursor-pointer'
            onClick={() => navigate('/')}
          />
          <div className='max-w-64 sm:max-w-xs'>
            <p className='text-sm font-medium capitalize truncate'>{project.name}</p>
            <p className='text-xs text-gray-400 -mt-0.5'>Previewing last saved version</p>
          </div>
          <div className='sm:hidden flex-1 flex justify-end'>
            {isMenuOpen ? (
              <XIcon onClick={() => setIsMenuOpen(false)} className='size-6 cursor-pointer' />
            ) : (
              <MessageSquareIcon
                onClick={() => setIsMenuOpen(true)}
                className='size-6 cursor-pointer'
              />
            )}
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2 bg-gray-800/60 rounded-full p-1 text-xs sm:text-sm'>
          {deviceOptions.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setDevice(id)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${
                device === id ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              <Icon className='size-4' />
              <span className='hidden sm:inline'>{label}</span>
            </button>
          ))}
        </div>

        <div className='flex flex-wrap items-center justify-end gap-3 gap-y-2 flex-1 text-xs sm:text-sm'>
          <button
            onClick={saveProject}
            disabled={isSaving}
            className='flex items-center gap-2 px-3.5 py-1 rounded bg-gray-800/70 hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
          >
            {isSaving ? (
              <>
                <Loader2Icon className='size-4 animate-spin' />
                Saving
              </>
            ) : (
              <>
                <SaveIcon size={16} />
                Save
              </>
            )}
          </button>
          <Link
            target='_blank'
            to={`/preview/${project.id}`}
            className='flex items-center gap-2 px-3.5 py-1 rounded bg-gray-800/70 hover:bg-gray-800 transition-colors'
          >
            <EyeIcon size={16} />
            Full Preview
          </Link>
          <button
            onClick={downloadCode}
            className='bg-linear-to-br from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white px-3.5 py-1 flex items-center gap-2 rounded transition-colors'
          >
            <DownloadIcon size={16} />
            Download
          </button>
          <button
            onClick={togglePublish}
            className='bg-linear-to-br from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white px-3.5 py-1 flex items-center gap-2 rounded transition-colors'
          >
            {project.isPublished ? (
              <>
                <EyeOffIcon size={16} />
                Unpublish
              </>
            ) : (
              <>
                <EyeIcon size={16} />
                Publish
              </>
            )}
          </button>
        </div>
      </div>

      <div className='flex-1 flex flex-col sm:flex-row overflow-hidden'>
        <Sidebar
          isMenuOpen={isMenuOpen}
          project={project}
          setProject={(updatedProject) => setProject(updatedProject)}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
          onCloseMenu={closeMenu}
        />
        <div className='flex-1 p-3 sm:p-4 flex items-center justify-center'>
          <div className='relative w-full max-w-full' style={previewStyle}>
            <ProjectPreview
              ref={previewRef}
              project={project}
              isGenerating={isGenerating}
              device={device}
            />
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div
          className='fixed inset-0 bg-black/60 sm:hidden z-40'
          onClick={closeMenu}
          aria-hidden='true'
        />
      )}
    </div>
  );
};

export default Projects;
