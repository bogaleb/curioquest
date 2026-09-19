import {AuthForm} from '@/components/auth/auth-form';
export default async function Page({searchParams}:{searchParams:Promise<{error?:string}>}){const params=await searchParams;return <AuthForm mode="sign-in" initialError={params.error==='confirmation'?'That confirmation link expired or could not be verified. Try signing in or request a new password reset link.':''}/>;}
