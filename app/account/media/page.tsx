import {redirect} from 'next/navigation';
import {authenticatedParent} from '@/lib/backend/context';
import {MediaLibrary} from '@/components/auth/media-library';
export default async function Page(){if(!await authenticatedParent())redirect('/auth/sign-in');return <MediaLibrary/>;}
