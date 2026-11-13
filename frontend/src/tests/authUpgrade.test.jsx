import React from 'react';
import {test,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import Account from '../pages/Account.jsx';
import GoogleSignIn from '../components/GoogleSignIn.jsx';
import PasswordRecovery from '../components/PasswordRecovery.jsx';
const reply=(data,status=200)=>({ok:status<400,status,headers:{get:(name)=>name.toLowerCase()==='x-gazu-api'?'gazu-store':null},json:async()=>data});
afterEach(()=>{cleanup();vi.unstubAllEnvs();vi.unstubAllGlobals();sessionStorage.clear();});
function gis(){vi.stubEnv('VITE_GOOGLE_CLIENT_ID','test.apps.googleusercontent.com');let config;const renderButton=vi.fn((node)=>{const b=document.createElement('button');b.textContent='Continue with Google';b.onclick=()=>config.callback({credential:'test-credential-never-persist'});node.appendChild(b);});vi.stubGlobal('google',{accounts:{id:{initialize:vi.fn(c=>config=c),renderButton,disableAutoSelect:vi.fn()}}});return renderButton;}
test('Google button uses GIS nonce and first-time registration enters OTP without storing credential',async()=>{
 gis();const login=vi.fn();const fetcher=vi.fn(async url=>reply(url.endsWith('challenge')?{nonce:'browser-nonce'}:{requiresVerification:true,email:'new@example.test',retryAfter:60,message:'Code sent'}));vi.stubGlobal('fetch',fetcher);
 render(<Account onLogin={login} />);fireEvent.click(await screen.findByText('Continue with Google'));
 await screen.findByLabelText('Verification code');expect(login).not.toHaveBeenCalled();expect(sessionStorage.getItem('gazu-pending-email')).toBe('new@example.test');expect(JSON.stringify(sessionStorage)).not.toContain('credential');
 expect(window.google.accounts.id.initialize).toHaveBeenCalledWith(expect.objectContaining({nonce:'browser-nonce',auto_select:false}));
});
test('returning Google session uses existing login callback once',async()=>{
 gis();const login=vi.fn();vi.stubGlobal('fetch',vi.fn(async url=>reply(url.endsWith('challenge')?{nonce:'nonce'}:{token:'gazu-session',user:{id:'u1'}})));
 render(<Account onLogin={login} />);fireEvent.click(await screen.findByText('Continue with Google'));await waitFor(()=>expect(login).toHaveBeenCalledOnce());expect(login).toHaveBeenCalledWith(expect.objectContaining({token:'gazu-session'}));
});
test('Google collision shows existing-account linking instruction',async()=>{
 gis();vi.stubGlobal('fetch',vi.fn(async url=>url.endsWith('challenge')?reply({nonce:'nonce'}):reply({message:'Sign in with your existing method, then link Google in Account settings.'},409)));
 render(<Account onLogin={vi.fn()} />);fireEvent.click(await screen.findByText('Continue with Google'));expect(await screen.findByRole('alert')).toHaveTextContent('link Google');
});
test('Google challenge failure is retryable and does not automatically loop',async()=>{
 gis();const fetcher=vi.fn(async()=>reply({message:'Sign-in unavailable'},503));vi.stubGlobal('fetch',fetcher);
 render(<GoogleSignIn onCredential={vi.fn()} />);expect(await screen.findByRole('alert')).toHaveTextContent('Sign-in unavailable');expect(fetcher).toHaveBeenCalledOnce();fireEvent.click(screen.getByText('Retry Google sign-in'));await waitFor(()=>expect(fetcher).toHaveBeenCalledTimes(2));
});
test('successful OTP activation accepts normal session and clears pending state',async()=>{
 sessionStorage.setItem('gazu-pending-email','new@example.test');const login=vi.fn();vi.stubGlobal('fetch',vi.fn(async()=>reply({message:'Verified',token:'gazu-session',user:{id:'u1'}})));
 render(<Account onLogin={login} />);fireEvent.change(screen.getByLabelText('Verification code'),{target:{value:'123456'}});fireEvent.click(screen.getByText('VERIFY OTP'));await waitFor(()=>expect(login).toHaveBeenCalledOnce());expect(sessionStorage.getItem('gazu-pending-email')).toBeNull();
});
test('registration confirmation mismatch does not call backend',()=>{
 const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);render(<Account onLogin={vi.fn()} />);fireEvent.click(screen.getByText('New here? CREATE AN ACCOUNT'));
 fireEvent.change(screen.getByLabelText('Password'),{target:{value:'Password123!'}});fireEvent.change(screen.getByLabelText('Confirm password'),{target:{value:'Different123!'}});fireEvent.submit(screen.getByText('CREATE ACCOUNT').closest('form'));expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match');expect(fetcher).not.toHaveBeenCalled();
});
test('recovery submits once, keeps form on failure and clears password on success',async()=>{
 const fetcher=vi.fn(async(url)=>url.endsWith('forgot-password')?reply({message:'If eligible, check email'}):reply({message:'Password updated'}));vi.stubGlobal('fetch',fetcher);
 render(<PasswordRecovery onBack={vi.fn()} initialEmail='buyer@example.test' />);fireEvent.click(screen.getByText('SEND RECOVERY CODE'));await screen.findByLabelText('Recovery code');
 fireEvent.change(screen.getByLabelText('Recovery code'),{target:{value:'123456'}});fireEvent.change(screen.getByLabelText('New password'),{target:{value:'Password123!'}});fireEvent.change(screen.getByLabelText('Confirm new password'),{target:{value:'Password123!'}});
 const form=screen.getByText('UPDATE PASSWORD').closest('form');fireEvent.submit(form);fireEvent.submit(form);await screen.findByText('PASSWORD UPDATED.');expect(fetcher).toHaveBeenCalledTimes(2);expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
});
test('OTP resend cooldown survives reload without resending',()=>{
 sessionStorage.setItem('gazu-pending-email','buyer@example.test');sessionStorage.setItem('gazu-otp-until',String(Date.now()+60000));const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);render(<Account />);expect(screen.getByText(/RESEND IN/)).toBeDisabled();expect(fetcher).not.toHaveBeenCalled();
});
