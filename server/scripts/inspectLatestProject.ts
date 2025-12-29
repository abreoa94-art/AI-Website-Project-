import 'dotenv/config';
import prisma from '../lib/prisma.js';

const run = async () => {
  const project = await prisma.websiteProject.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      versions: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
  });

  if (!project) {
    console.log('No projects found.');
    return;
  }

  console.log('Latest project:', {
    id: project.id,
    hasCode: Boolean(project.current_code),
    codeLength: project.current_code?.length ?? 0,
    versions: project.versions.map((v) => ({ id: v.id, codeLength: v.code.length })),
  });
};

run()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
