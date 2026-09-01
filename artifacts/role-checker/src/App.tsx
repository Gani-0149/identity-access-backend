import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Activity, ArrowRight, Check, CircleAlert, Code2, ScanLine } from 'lucide-react';
import {
  getGetUserRoleQueryKey,
  getHealthCheckQueryKey,
  useGetUserRole,
  useHealthCheck,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Form } from '@/components/ui/form';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type AddressForm = {
  address: string;
};

function Home() {
  const form = useForm<AddressForm>({ defaultValues: { address: '' } });
  const [submittedAddress, setSubmittedAddress] = useState('');
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const roleQuery = useGetUserRole(submittedAddress, {
    query: {
      enabled: submittedAddress.length > 0,
      queryKey: getGetUserRoleQueryKey(submittedAddress),
    },
  });
  const isLookingUp = roleQuery.isLoading || roleQuery.isFetching;
  const hasResult = Boolean(roleQuery.data);
  const healthLabel = health.isLoading
    ? 'CHECKING'
    : health.isError
      ? 'OFFLINE'
      : String(health.data?.status ?? 'ONLINE').toUpperCase();
  const errorMessage =
    roleQuery.error instanceof Error
      ? roleQuery.error.message
      : 'The service could not resolve that address. Try again.';

  const handleLookup = ({ address }: AddressForm) => {
    const normalizedAddress = address.trim();
    if (!normalizedAddress) {
      form.setError('address', {
        type: 'manual',
        message: 'Enter an address to run a lookup.',
      });
      return;
    }

    form.clearErrors('address');
    if (normalizedAddress === submittedAddress) {
      void roleQuery.refetch();
      return;
    }
    setSubmittedAddress(normalizedAddress);
  };

  return (
    <main className="role-app">
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-foreground/15 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-foreground text-primary shadow-[3px_3px_0_hsl(var(--primary))]">
              <Code2 className="size-[18px]" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <div className="display-font text-sm font-extrabold tracking-[-0.04em]">ROLE CHECK</div>
              <div className="mono-font mt-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">address intelligence</div>
            </div>
          </div>
          <div className="mono-font flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-muted-foreground">
            <Activity className={`size-3 ${health.isError ? 'text-destructive' : 'text-accent'}`} />
            <span data-testid="status-api">{healthLabel}</span>
          </div>
        </header>

        <section className="page-enter grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1fr_0.92fr] lg:gap-24 lg:py-20">
          <div className="max-w-xl">
            <div className="mono-font mb-7 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              <span className="h-px w-8 bg-secondary" />
              fast path / 01
            </div>
            <h1 className="display-font max-w-lg text-[clamp(3.5rem,8vw,6.9rem)] font-extrabold leading-[0.86] tracking-[-0.08em] text-foreground">
              Know the
              <span className="relative mx-2 inline-block">
                role.
                <span className="absolute -bottom-1 left-0 h-2 w-full -skew-x-12 bg-primary/80 lg:h-3" />
              </span>
            </h1>
            <p className="mt-8 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
              Paste an address. Get the assigned role. One clean answer for the moment you need it.
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleLookup)} className="mt-10 max-w-xl">
                <label htmlFor="address" className="mono-font mb-3 block text-[10px] font-bold uppercase tracking-[0.18em] text-foreground">
                  Address to inspect
                </label>
                <div className="group relative flex flex-col gap-3 sm:flex-row">
                  <div className="relative min-w-0 flex-1">
                    <ScanLine className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-focus-within:text-secondary" />
                    <input
                      id="address"
                      data-testid="input-address"
                      aria-invalid={Boolean(form.formState.errors.address)}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="0x… or account address"
                      {...form.register('address')}
                      className="h-14 w-full rounded-xl border border-input bg-card/80 pl-12 pr-4 font-mono text-sm text-foreground shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted-foreground/70 focus:border-secondary focus:bg-card focus:ring-4 focus:ring-secondary/15"
                    />
                  </div>
                  <button
                    type="submit"
                    data-testid="button-lookup"
                    disabled={isLookingUp}
                    className="group/button inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-foreground px-6 font-bold text-primary shadow-[4px_4px_0_hsl(var(--primary))] outline-none transition-[transform,box-shadow,background-color] duration-200 hover:bg-secondary hover:text-secondary-foreground focus-visible:ring-4 focus-visible:ring-secondary/30 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_hsl(var(--primary))] disabled:cursor-wait disabled:opacity-75 sm:shrink-0"
                  >
                    {isLookingUp ? 'Looking up' : 'Check role'}
                    <ArrowRight className="size-[17px] transition-transform duration-200 group-hover/button:translate-x-1" />
                  </button>
                </div>
                {form.formState.errors.address ? (
                  <p data-testid="error-address" className="mt-3 text-sm font-medium text-destructive">
                    {form.formState.errors.address.message}
                  </p>
                ) : (
                  <p className="mono-font mt-3 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Read-only lookup · no wallet connection required
                  </p>
                )}
              </form>
            </Form>
          </div>

          <div className="relative">
            <div className="absolute -right-3 -top-3 size-16 rounded-full border border-secondary/30" />
            <div className="absolute -bottom-5 -left-5 size-8 bg-primary" />
            <section className="relative min-h-[350px] overflow-hidden rounded-2xl border border-foreground/15 bg-card p-6 shadow-[8px_8px_0_hsl(var(--foreground)/0.12)] sm:p-8" aria-live="polite">
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div className="mono-font text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Lookup result
                </div>
                <div className="mono-font text-[10px] text-muted-foreground">ROLE / 001</div>
              </div>

              {!submittedAddress ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                  <div className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-dashed border-secondary/50 bg-secondary/5 text-secondary">
                    <Code2 className="size-7" strokeWidth={1.5} />
                  </div>
                  <p data-testid="text-empty-result" className="display-font text-xl font-bold tracking-[-0.04em]">Waiting on an address</p>
                  <p className="mt-2 max-w-[220px] text-sm leading-6 text-muted-foreground">Your resolved role will appear here.</p>
                </div>
              ) : isLookingUp ? (
                <div data-testid="status-loading" className="result-enter flex min-h-[260px] flex-col justify-center">
                  <div className="mono-font mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
                    <span className="size-2 animate-pulse rounded-full bg-secondary" />
                    Querying role service
                  </div>
                  <div className="skeleton-shimmer h-16 w-40 rounded-lg" />
                  <div className="skeleton-shimmer mt-5 h-4 w-full max-w-[270px] rounded" />
                  <div className="skeleton-shimmer mt-3 h-4 w-3/4 max-w-[205px] rounded" />
                </div>
              ) : roleQuery.isError ? (
                <div data-testid="status-error" className="result-enter flex min-h-[260px] flex-col justify-center">
                  <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <CircleAlert className="size-6" />
                  </div>
                  <p className="display-font text-xl font-bold tracking-[-0.04em]">Lookup failed</p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{errorMessage}</p>
                  <button
                    type="button"
                    data-testid="button-retry"
                    onClick={() => void roleQuery.refetch()}
                    className="mt-6 w-fit rounded-lg border border-foreground/20 px-4 py-2 text-sm font-bold text-foreground outline-none transition-colors hover:border-secondary hover:text-secondary focus-visible:ring-4 focus-visible:ring-secondary/20"
                  >
                    Try again
                  </button>
                </div>
              ) : hasResult ? (
                <div data-testid="status-result" className="result-enter flex min-h-[260px] flex-col justify-between pt-8">
                  <div>
                    <div className="mono-font mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Assigned role</div>
                    <div data-testid="text-role" className="display-font text-6xl font-extrabold tracking-[-0.08em] text-secondary sm:text-7xl">
                      {roleQuery.data?.role}
                    </div>
                  </div>
                  <div className="mt-12 border-t border-border pt-5">
                    <div className="mono-font mb-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Inspected address</div>
                    <div data-testid="text-address" className="break-all font-mono text-xs leading-5 text-foreground">{submittedAddress}</div>
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground">
                      <Check className="size-3.5" strokeWidth={3} />
                      Verified response
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-foreground/15 py-5 text-[10px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="mono-font uppercase tracking-[0.14em]">Role Check / developer utility</span>
          <span className="mono-font uppercase tracking-[0.14em]">Results are read directly from the role service</span>
        </footer>
      </div>
    </main>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
