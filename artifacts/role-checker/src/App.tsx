import { type FormEvent, type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  getGetUserRoleQueryKey,
  useGetUserRole,
  useRegisterUser,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import {
  Route,
  Router as WouterRouter,
  Switch,
  useLocation,
} from 'wouter';

const queryClient = new QueryClient();

type RegistrationResponse = {
  success: boolean;
  user?: {
    address: string;
    name: string;
  };
  error?: string;
};

function Home() {
  const [address, setAddress] = useState('');
  const [connectedAddress, setConnectedAddress] = useState('');
  const [connectError, setConnectError] = useState('');
  const [registrationAddress, setRegistrationAddress] = useState('');
  const [registrationName, setRegistrationName] = useState('');
  const [registrationResponse, setRegistrationResponse] =
    useState<RegistrationResponse | null>(null);
  const [registrationError, setRegistrationError] = useState('');

  const roleQuery = useGetUserRole(connectedAddress, {
    query: {
      enabled: connectedAddress.length > 0,
      queryKey: getGetUserRoleQueryKey(connectedAddress),
    },
  });
  const registerMutation = useRegisterUser();

  const handleConnect = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedAddress = address.trim();

    if (!normalizedAddress) {
      setConnectError('Enter a wallet address first.');
      setConnectedAddress('');
      return;
    }

    setConnectError('');
    setConnectedAddress(normalizedAddress);
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedAddress = registrationAddress.trim();
    const normalizedName = registrationName.trim();

    setRegistrationResponse(null);
    setRegistrationError('');

    if (!normalizedAddress || !normalizedName) {
      setRegistrationError('Enter both an address and a name.');
      return;
    }

    try {
      const response = await registerMutation.mutateAsync({
        data: {
          address: normalizedAddress,
          name: normalizedName,
        },
      });
      setRegistrationResponse(response);
    } catch (error) {
      setRegistrationError(
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.',
      );
    }
  };

  return (
    <main className="app">
      <header className="page-header">
        <h1>Identity Access Platform</h1>
        <p>Connect a wallet to view its role.</p>
      </header>

      <form className="connect-form" onSubmit={handleConnect}>
        <label htmlFor="wallet-address">Wallet address</label>
        <div className="connect-row">
          <input
            id="wallet-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Enter wallet address"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit">Connect</button>
        </div>
        {connectError ? <p className="error">{connectError}</p> : null}
      </form>

      <div className="sections">
        <section className="section" aria-live="polite">
          <h2>Your role</h2>
          {!connectedAddress ? (
            <p className="muted">Connect a wallet to see its role.</p>
          ) : roleQuery.isLoading || roleQuery.isFetching ? (
            <p className="muted">Loading role...</p>
          ) : roleQuery.isError ? (
            <p className="error">Unable to load the role.</p>
          ) : (
            <div className="role-result">
              <span className="role-label">Role</span>
              <strong>{roleQuery.data?.role ?? 'Unknown'}</strong>
              <span className="address">{connectedAddress}</span>
            </div>
          )}
        </section>

        <section className="section">
          <h2>Register a user</h2>
          <form className="registration-form" onSubmit={handleRegister}>
            <label htmlFor="registration-address">Address</label>
            <input
              id="registration-address"
              value={registrationAddress}
              onChange={(event) => setRegistrationAddress(event.target.value)}
              placeholder="Wallet address"
              autoComplete="off"
              spellCheck={false}
            />

            <label htmlFor="registration-name">Name</label>
            <input
              id="registration-name"
              value={registrationName}
              onChange={(event) => setRegistrationName(event.target.value)}
              placeholder="Name"
              autoComplete="name"
            />

            <button type="submit" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? 'Registering...' : 'Register'}
            </button>
          </form>

          <div className="registration-result" aria-live="polite">
            <h3>Registration result</h3>
            {registrationError ? (
              <p className="error">{registrationError}</p>
            ) : registrationResponse ? (
              <pre>{JSON.stringify(registrationResponse, null, 2)}</pre>
            ) : (
              <p className="muted">The API response will appear here.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Router() {
  return (
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
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;