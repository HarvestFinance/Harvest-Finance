'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthShell } from '@/components/auth/AuthShell';
import { useAuthStore } from '@/lib/stores/auth-store';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth';

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    clearError();
    await forgotPassword(data.email);
    setIsSubmitted(true);
  };

  return (
    <AuthShell
      title={isSubmitted ? 'Check your inbox' : 'Reset your password'}
      subtitle={
        isSubmitted
          ? 'A reset link is on its way. Use it to create a new password and return to your dashboard.'
          : 'Enter the email tied to your account and we will send reset instructions immediately.'
      }
      footer={
        <p>
          Remembered your password?{' '}
          <Link href="/login" className="inline-link">
            Back to sign in
          </Link>
        </p>
      }
    >
      {isSubmitted ? (
        <div className="status-banner status-banner--success" role="status" aria-live="polite">
          <p>Password reset instructions were sent successfully.</p>
        </div>
      ) : null}

      {!isSubmitted ? (
        <>
          {error ? (
            <div className="status-banner status-banner--error mb-5" role="alert" aria-live="polite">
              <p>{error}</p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="field-label">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={isLoading}
                className="input-field"
                placeholder="farmer@example.com"
              />
              {errors.email ? (
                <p id="email-error" className="mt-2 text-sm text-red-600" role="alert">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <button type="submit" disabled={isLoading} aria-busy={isLoading} className="btn-primary">
              {isLoading ? 'Sending reset link...' : 'Send reset link'}
            </button>
          </form>
        </>
      ) : (
        <div className="mt-6 space-y-4">
          <Link href="/login" className="btn-primary">
            Back to sign in
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
