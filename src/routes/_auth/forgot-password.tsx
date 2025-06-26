import { createFileRoute, Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Mail, ArrowRight } from 'lucide-react';
import { requestForgotPassword } from '@/utils/apiClient'; // implement API call

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
});
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const Route = createFileRoute('/_auth/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsLoading(true);
    try {
      await requestForgotPassword(values.email);
      setEmailSent(true);
      toast.success('Email reset password telah dikirim jika email terdaftar.');
    } catch (error: any) {
      form.setError('root', {
        message: error?.response?.data?.message || 'Terjadi kesalahan, coba lagi.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto my-4 sm:my-8">
      <Card className="w-full shadow-2xl border-0 overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl">
        <div className="h-2 bg-gradient-to-r from-primary via-sky-400 to-primary/80 animate-pulse" />
        <CardHeader className="space-y-4 pb-6 pt-6">
          <div className="flex flex-col items-center gap-2">
            <Mail className="w-10 h-10 text-primary drop-shadow" />
            <CardTitle className="text-2xl font-bold text-center text-primary drop-shadow-md">
              Lupa Kata Sandi
            </CardTitle>
          </div>
          <CardDescription className="text-center text-base font-normal text-muted-foreground">
            Masukkan email akun Anda, kami akan mengirim link reset password.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-2 px-8">
          {emailSent ? (
            <div className="p-4 rounded-md bg-accent/15 border border-accent/30 text-center text-primary">
              <div className="flex flex-col items-center gap-2">
                <ArrowRight className="w-7 h-7 mb-1 text-accent" />
                <span className="font-semibold text-base">
                  Cek email Anda untuk link reset password.
                </span>
                <span className="text-sm text-muted-foreground">
                  Belum menerima email? Periksa folder spam/junk.
                </span>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
                autoComplete="on"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-primary mb-1">
                        Email
                        <span className="ml-1 text-primary text-base font-bold">*</span>
                      </FormLabel>
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Mail size={18} />
                        </div>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Masukkan email Anda"
                            className="bg-background border-input focus:border-primary focus:ring-2 focus:ring-primary/30 py-5 pl-11 text-base rounded-md outline-none transition-all"
                            aria-label="Email"
                            autoComplete="email"
                            autoFocus
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="text-xs text-destructive" />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 mt-2">
                    <p className="text-sm text-destructive">
                      {form.formState.errors.root.message}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 py-5 text-base font-semibold rounded-md shadow-sm hover:shadow mt-2 flex items-center justify-center gap-2 focus:ring-2 focus:ring-primary/30"
                  disabled={isLoading}
                  aria-label="Kirim Email Reset"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center" aria-hidden="true">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Kirim...</span>
                    </div>
                  ) : (
                    <>
                      <span>Kirim Email Reset</span>
                      <ArrowRight size={20} className="ml-1" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col items-center gap-2 pb-6 pt-2">
          <span className="text-base text-muted-foreground">
            Ingat password?{' '}
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline focus:underline transition-colors"
            >
              Masuk disini
            </Link>
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
