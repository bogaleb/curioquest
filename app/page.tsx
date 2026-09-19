import {redirect} from 'next/navigation';
import {authenticatedParent} from '@/lib/backend/context';
import CurioQuest from '@/components/learning/curioquest-app';
export default async function Page(){if(!await authenticatedParent())redirect('/auth/sign-in');return <CurioQuest/>;}
