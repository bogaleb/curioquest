import {createClient} from '@/lib/supabase/server';
import {requestJson,RequestBodyError} from '@/lib/request-json';
export async function POST(request:Request) {
 const origin=new URL(request.url).origin;
 if(request.headers.get('origin')!==origin)return Response.json({error:'Request not allowed.'},{status:403});
 try{
  const input=await requestJson(request,3000),client=await createClient(),action=input.action;
  const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
  if(action==='sign-out'){const {error}=await client.auth.signOut();if(error)throw error;const response=reply({redirect:'/auth/sign-in'});response.headers.append('Set-Cookie','curioquest_parent=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');return response;}
  const email=typeof input.email==='string'?input.email.trim():'',password=typeof input.password==='string'?input.password:'';
  if(action!=='update-password'&&(!email||email.length>254))return reply({error:'Enter your parent email.'},400);
  if(['sign-up','update-password'].includes(String(action))&&(password.length<12||password.length>128))return reply({error:'Use a password with 12–128 characters.'},400);
  if(action==='sign-up'){
   const {error}=await client.auth.signUp({email,password,options:{data:{display_name:typeof input.name==='string'?input.name.slice(0,80):''},emailRedirectTo:origin+'/auth/callback'}});
   if(error)return reply({error:'Account creation could not be completed. Check your details or try signing in.'},400);
   return reply({message:'Check your email to confirm your parent account, then sign in.'});
  }
  if(action==='sign-in'){
   const {error}=await client.auth.signInWithPassword({email,password});
   return error?reply({error:'Sign-in failed. Check your email, password, and email confirmation.'},400):reply({redirect:'/account/children'});
  }
  if(action==='recover'){
   const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:origin+'/auth/callback?next=/auth/update-password'});
   if(error)return reply({error:'Password reset is temporarily unavailable. Please try again.'},429);
   return reply({message:'If that address has an account, a password reset link is on its way.'});
  }
  if(action==='update-password'){
   const {data,error:authError}=await client.auth.getUser();if(authError||!data.user)return reply({error:'Open a valid password reset link first.'},401);
   const {error}=await client.auth.updateUser({password});if(error)return reply({error:'Your password could not be updated. Try a new reset link.'},400);
   await client.auth.signOut();return reply({redirect:'/auth/sign-in'});
  }
  return reply({error:'Choose an account action.'},400);
 }catch(error){return Response.json({error:error instanceof RequestBodyError?error.message:'Account service is unavailable. Please try again.'},{status:error instanceof RequestBodyError?error.status:503,headers:{'Cache-Control':'no-store'}});}
}
