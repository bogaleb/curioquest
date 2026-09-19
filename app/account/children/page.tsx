import {redirect} from 'next/navigation';
import {authenticatedParent} from '@/lib/backend/context';
import {ChildChooser} from '@/components/auth/child-chooser';
export default async function Page(){if(!await authenticatedParent())redirect('/auth/sign-in');return <ChildChooser/>;}
