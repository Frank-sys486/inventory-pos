'use server'

import { signIn } from '@/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import connectToDatabase from '@/lib/mongodb'
import mongoose from 'mongoose'

// Basic User model for auth actions
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String },
  created_at: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    console.error('Login error:', error);
    redirect('/error');
  }

  revalidatePath('/admin', 'layout');
  redirect('/admin');
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string || email.split('@')[0];

  try {
    await connectToDatabase();
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // IMPORTANT: In production, hash the password using bcrypt or similar!
    await User.create({
      email,
      password,
      name,
    });

    // Auto login after signup
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    console.error('Signup error:', error);
    redirect('/error');
  }

  revalidatePath('/admin', 'layout');
  redirect('/admin');
}
