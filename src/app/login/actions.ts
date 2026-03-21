'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { dbUsers } from '@/lib/pouchdb'

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter both email and password' };
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/admin',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid email or password' };
        default:
          return { error: 'Something went wrong. Please try again.' };
      }
    }
    // Next.js redirect errors should be re-thrown
    if ((error as any).digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string || email.split('@')[0];

  try {
    // Check if user exists
    const result = await dbUsers.find({
      selector: { email }
    });

    if (result.docs.length > 0) {
      throw new Error('User already exists');
    }

    // Create new user in PouchDB
    const newUser = {
      _id: new Date().getTime().toString(),
      email,
      password, // Note: In production, hash this!
      name,
      created_at: new Date()
    };

    await dbUsers.put(newUser);

    // Auto login after signup
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        throw error;
    }
    console.error('Signup error:', error);
    redirect('/error');
  }

  revalidatePath('/admin', 'layout');
  redirect('/admin');
}
