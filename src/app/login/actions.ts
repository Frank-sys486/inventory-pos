'use server'

import { signIn } from '@/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { dbUsers } from '@/lib/pouchdb'

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/admin',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('NEXT_REDIRECT')) {
        throw error;
      }
      console.error('Login error:', error.message);
    }
    redirect('/error');
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
