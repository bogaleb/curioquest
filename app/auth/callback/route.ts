import {createClient} from '@/lib/supabase/server';
import {NextResponse} from 'next/server';
export async function GET(request:Request) {
 const url=new URL(request.url),code=url.searchParams.get('code'),client=await createClient();
 const next=url.searchParams.get('next')==='/auth/update-password'?'/auth/update-password':'/account/children';
 if(code){const {error}=await client.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(next,url.origin),{headers:{'Cache-Control':'no-store'}});}
 return NextResponse.redirect(new URL('/auth/sign-in?error=confirmation',url.origin),{headers:{'Cache-Control':'no-store'}});
}
