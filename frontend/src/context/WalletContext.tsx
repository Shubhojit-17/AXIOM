import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { AppConfig, showConnect, UserSession } from '@stacks/connect';

export type Role = 'user' | 'developer';

interface WalletContextType {
  wallet: string | null;
  role: Role;
  setRole: (r: Role) => void;
  connectWallet: () => void;
  disconnectWallet: () => void;
  isConnected: boolean;
}

const WalletContext = createContext<WalletContextType>({
  wallet: null,
  role: 'user',
  setRole: () => {},
  connectWallet: () => {},
  disconnectWallet: () => {},
  isConnected: false,
});

const appConfig = new AppConfig(['store_write']);
const userSession = new UserSession({ appConfig });

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<string | null>(() => {
    return localStorage.getItem('axiom_wallet');
  });
  const [role, setRoleState] = useState<Role>(() => {
    return (localStorage.getItem('axiom_role') as Role) || 'user';
  });

  // Check if user session is already signed in
  useEffect(() => {
    if (userSession.isUserSignedIn() && !wallet) {
      const userData = userSession.loadUserData();
      const addr =
        userData.profile?.stxAddress?.testnet ||
        userData.profile?.stxAddress?.mainnet ||
        '';
      if (addr) {
        setWallet(addr);
        localStorage.setItem('axiom_wallet', addr);
      }
    }
  }, [wallet]);

  const connectWallet = useCallback(() => {
    showConnect({
      appDetails: {
        name: 'AXIOM',
        icon: window.location.origin + '/vite.svg',
      },
      onFinish: () => {
        const userData = userSession.loadUserData();
        const addr =
          userData.profile?.stxAddress?.testnet ||
          userData.profile?.stxAddress?.mainnet ||
          '';
        setWallet(addr);
        localStorage.setItem('axiom_wallet', addr);
      },
      userSession,
    });
  }, []);

  const disconnectWallet = useCallback(() => {
    userSession.signUserOut();
    setWallet(null);
    localStorage.removeItem('axiom_wallet');
  }, []);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    localStorage.setItem('axiom_role', r);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        role,
        setRole,
        connectWallet,
        disconnectWallet,
        isConnected: !!wallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
