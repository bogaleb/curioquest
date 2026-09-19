import { withFamily } from '@/lib/backend/context';
import { read } from '@/lib/backend/repository';
import { parentAuthorized } from '@/lib/parent-security';
export const GET = withFamily(async request => {
  if (!await parentAuthorized(request)) return Response.json({error:'Unlock Parent Corner before downloading learning records.'},{status:403});
  const data = await read<Record<string,unknown>>('export');
  return Response.json({...data,schemaVersion:5,exportedAt:new Date().toISOString()},{
    headers:{'Cache-Control':'no-store','Content-Disposition':'attachment; filename=curioquest-learning-records.json'},
  });
});
