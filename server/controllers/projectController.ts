import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import openai from '../configs/openai.js';
//controller function to make revision 

export const makeRevision = async (req: Request, res: Response) => {
    const userId = req.userId;
    try{
        const {projectId} = req.params;
        const {message} = req.body;
        const requestMessage = typeof message === 'string' ? message.trim() : '';

        const user = await prisma.user.findUnique({
            where: {id: userId},
          
        });

        if(!userId || !user){
            return res.status(401).json({message: 'Unauthorized'});
        }

        if(user.credits < 5){
            return res.status(403).json({message: 'Insufficient credits'}); 
        }

        if(!requestMessage){
            return res.status(400).json({message: 'Please enter a valid message'}); 
        }

        const currentProject = await prisma.websiteProject.findUnique({
            where: {id: projectId, userId: userId},
            include: {versions:true}
        });

        if(!currentProject){
             return res.status(404).json({message: 'Project not found'}); 
        }

        await prisma.conversation.create({
            data: {
                role: 'user',
                content: requestMessage,
                projectId
            }
        })

        await prisma.user.update({
            where: {id: userId},
            data: {credits: {decrement: 5}}
            
        })

        // enhance user prompt

        const promptEnhanceResponse = await openai.chat.completions.create({
            model:'kwaipilot/kat-coder-pro:free',
            messages:[
                {role: 'system', 
                    content: `You are a prompt enhancement specialist. The user wants to make changes to their website. Enhance their request to be more specific and actionable for a web developer.

                     Enhance this by:
                     1. Being specific about what elements to change
                        2. Mentioning design details (colors, spacing, sizes)
                            3. Clarifying the desired outcome
                                4. Using clear technical terms

                    Return ONLY the enhanced request, nothing else. Keep it concise (1-2 sentences).`},
                {role: 'user', 
                    content: `user request: "${requestMessage}"`}
            ]
        })

        const enhancedPrompt = promptEnhanceResponse.choices[0]?.message?.content?.trim() || requestMessage;

        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: `I've enhanced your prompt to: "${enhancedPrompt}"`,
                projectId
            }
        })
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: 'Now making changes to your website...',
                projectId
            }
        })

        //Generate website code 

        const codeGenerationResponse = await openai.chat.completions.create({
            model:'kwaipilot/kat-coder-pro:free',
            messages:[
                {role: 'system', 
                    content:`You are an expert web developer. 

            CRITICAL REQUIREMENTS:
            - Return ONLY the complete updated HTML code with the requested changes.
            - Use Tailwind CSS for ALL styling (NO custom CSS).
            - Use Tailwind utility classes for all styling changes.
            - Include all JavaScript in <script> tags before closing </body>
            - Make sure it's a complete, standalone HTML document with Tailwind CSS
            - Return the HTML Code Only, nothing else

            Apply the requested changes while maintaining the Tailwind CSS styling approach.` },
            {
                role: 'user', 
                content: `Here is the current HTML code of the website: "${currentProject.current_code}" The user wants this change: "${enhancedPrompt}"`
                
            }
            ]
        })

        const code = codeGenerationResponse.choices[0]?.message?.content?.trim() || '';

        if(!code){
             await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: 'Unable to generate the code, please try again',
                projectId
            }
        })

        await prisma.user.update({
            where: {id: userId},
            data: {credits: {increment: 5}}
            
        })

        return res.status(500).json({message: 'Unable to generate website changes. Please try again.'});

        }

        const version = await prisma.version.create({
            data: {
                code: code.replace(/```[a-z]*\n?/gi, '')
                .replace(/```/g, '')
                .trim(),
                description: 'changes made',
                projectId
            }

        })

        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: 'Changes have been made to your website. Check out the new version!',
                projectId
            }
        })

        await prisma.websiteProject.update({
            where: {id: projectId},
            data: {current_code: code.replace(/```[a-z]*\n?/gi, '')
                .replace(/```/g, '')
                .trim(),
                current_version_index: version.id}
        })

                
       

        res.json({message: 'Changes made successfully'});
    }catch(error : any){
        if(userId){
            await prisma.user.update({
                where: {id: userId},
                data: {credits: {increment: 5}}
                
            })
        }

        console.log(error.code || error.message);
        res.status(500).json({message: 'Internal Server Error'});
    }
}

//controller function to rollnback to a specific version 

export const rollbackToVersion = async (req: Request, res: Response) => {
    try{
        const userId = req.userId;
        if(!userId){
            return res.status(401).json({message: 'Unauthorized'});
        }
        const {projectId, versionId} = req.params;

        const project = await prisma.websiteProject.findUnique({
            where: {id: projectId, userId},
            include: {versions: true}
        });

        if(!project){
            return res.status(404).json({message: 'Project not found'});
        }

        const version = project.versions.find((v) => v.id === versionId);
        if(!version){
            return res.status(404).json({message: 'Version not found'});
        }

        await prisma.websiteProject.update({
            where: {id: projectId, userId},
            data: {current_code: version.code,
                current_version_index: version.id}
        })

        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: `I've rolled back your website to selected version. You can preview it now.`,
                projectId
            }
        })

        res.json({message: 'Rollback successful'});
    } catch(error : any){
        console.log(error.code || error.message);
        res.status(500).json({message: 'Internal Server Error'});
  
    }
}

// controller function to delete a project 

export const deleteProject = async (req: Request, res: Response) => {
    try{
        const userId = req.userId;
        const {projectId } = req.params;
        if(!userId){
            return res.status(401).json({message: 'Unauthorized'});
        }
        

         await prisma.websiteProject.delete({
            where: {id: projectId, userId},
            
        });

    

        res.json({message: 'Project deleted successfully'});
    } catch(error : any){
        console.log(error.code || error.message);
        res.status(500).json({message: 'Internal Server Error'});
  
    }
}

// controller for getting project code for preview 


export const getProjectPreview = async (req: Request, res: Response) => {
    try{
        const userId = req.userId;
        const {projectId } = req.params;

        if(!userId){
            return res.status(401).json({message: 'Unauthorized'});
        }
        
        const project = await prisma.websiteProject.findFirst({
            where: {id: projectId, userId},
            include: {versions: true}
        })

        if(!project){
            return res.status(404).json({message: 'Project not found'});
        }

    
        res.json({project});
    } catch(error : any){
        console.log(error.code || error.message);
        res.status(500).json({message: 'Internal Server Error'});
  
    }
}

//controller get published projects

export const getPublishedProjects = async (req: Request, res: Response) => {
    try{
        
        
        const projects = await prisma.websiteProject.findMany({
            where: {isPublished: true},
            include: {user: true}
        })

        if(!projects || projects.length === 0){
            return res.json({projects: []});
        }

    
        res.json({projects});
    } catch(error : any){
        console.log(error.code || error.message);
        res.status(500).json({message: 'Internal Server Error'});
  
    }
}

//controller get single published project by id 


export const getProjectById = async (req: Request, res: Response) => {
    try{
        
        const {projectId } = req.params;
        const project = await prisma.websiteProject.findFirst({
            where: {id: projectId, },
            
        })

        if(!project || project.isPublished === false || !project?.current_code){
            return res.status(404).json({message: 'Project not found '});
        }

    
        res.json({
            code: project.current_code,
            project_code: project.current_code,
            project: { id: project.id }
        });
    } catch(error : any){
        console.log(error.code || error.message);
        res.status(500).json({message: 'Internal Server Error'});
  
    }
}

//controller function to save project 

export const saveProjectCode = async (req: Request, res: Response) => {
    try{
        const userId = req.userId;
        
        const {code } = req.body;
        const {projectId } = req.params;
        if(!userId){
            return res.status(401).json({message: 'Unauthorized'});
        }

        if(!code || code.trim() === ''){
            return res.status(400).json({message: 'Code cannot be empty'});
        }


        const project = await prisma.websiteProject.findFirst({
            where: {id: projectId, userId},
            
        })

        if(!project ){
            return res.status(404).json({message: 'Project not found '});
        }

        const sanitizedCode = code.trim();

        await prisma.websiteProject.update({
            where: {id: projectId},
            data: {current_code: sanitizedCode, current_version_index: ''}
        })



    
        res.json({message: 'Project saved successfully' });
    } catch(error : any){
        console.log(error.code || error.message);
        res.status(500).json({message: 'Internal Server Error'});
  
    }
}
