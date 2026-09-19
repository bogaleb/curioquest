'use client';
import {useState} from 'react';
import Link from 'next/link';
export function AuthForm({mode,initialError=''}:{mode:'sign-in'|'sign-up'|'recover'|'update-password';initialError?:string}) {
 const [busy,setBusy]=useState(false),[error,setError]=useState(initialError),[message,setMessage]=useState('');
 const title=mode==='sign-in'?'Welcome back':mode==='sign-up'?'Create your parent account':mode==='recover'?'Reset your password':'Choose a new password';
 return <main className="app-shell"><section className="panel" style={{maxWidth:480,margin:'8vh auto',padding:32}}>
  <Link className="brand" href="/">curioquest</Link><h1>{title}</h1><p>One parent account. A personal learning adventure for each child.</p>
  {error&&<p className="error" role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
  <form onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setError('');setMessage('');
   const values=new FormData(e.currentTarget);
   try{const response=await fetch('/auth/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:mode,email:values.get('email'),password:values.get('password'),name:values.get('name')}),signal:AbortSignal.timeout(20000)});
    const data=await response.json() as {error?:string;redirect?:string;message?:string};if(!response.ok)throw Error(data.error);if(data.redirect)window.location.assign(data.redirect);else setMessage(data.message??'Please check your email.');
   }catch(e){setError(e instanceof Error?e.message:'Please try again.');}finally{setBusy(false);}}}>
   {mode==='sign-up'&&<label>Your name<input name="name" required maxLength={80} autoComplete="name"/></label>}
   {mode!=='update-password'&&<label>Parent email<input name="email" type="email" required autoComplete="email"/></label>}
   {mode!=='recover'&&<label>Password<input name="password" type="password" required minLength={mode==='sign-in'?1:12} maxLength={128} autoComplete={mode==='sign-in'?'current-password':'new-password'}/>{mode!=='sign-in'&&<small>Use at least 12 characters.</small>}</label>}
   <button className="primary" disabled={busy}>{busy?'Please wait…':title}</button>
  </form>
  <p>{mode==='sign-in'?<><Link href="/auth/sign-up">Create an account</Link> · <Link href="/auth/recover">Forgot password?</Link></>:<Link href="/auth/sign-in">Back to sign in</Link>}</p>
 </section></main>;
}
