import { AbstractConnectorArguments, ConnectorUpdate } from '@web3-react/types'
import { AbstractConnector } from '@web3-react/abstract-connector'
import warning from 'tiny-warning'
import { SendReturnResult , SendReturn, Send, SendOld} from './types'

const __DEV__ = false;

function parseSendReturn(sendReturn: SendReturnResult | SendReturn): any {
  return sendReturn.hasOwnProperty('result') ? sendReturn.result : sendReturn
}

export class NoplatonProviderError extends Error {
  public constructor() {
    super()
    this.name = this.constructor.name
    this.message = 'No platon provider was found on window.platon.'
  }
}

export class UserRejectedRequestError extends Error {
  public constructor() {
    super()
    this.name = this.constructor.name
    this.message = 'The user rejected the request.'
  }
}

export class SamuraConnector extends AbstractConnector {
  constructor(kwargs: AbstractConnectorArguments) {
    super(kwargs)

    this.handleNetworkChanged = this.handleNetworkChanged.bind(this)
    this.handleChainChanged = this.handleChainChanged.bind(this)
    this.handleAccountsChanged = this.handleAccountsChanged.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  private handleChainChanged(chainId: string | number): void {
    if (__DEV__) {
      console.log("Handling 'chainChanged' event with payload", chainId)
    }
    this.emitUpdate({ chainId, provider: window.platon })
  }

  private handleAccountsChanged(accounts: string[]): void {
    if (__DEV__) {
      console.log("Handling 'accountsChanged' event with payload", accounts)
    }
    if (accounts.length === 0) {
      this.emitDeactivate()
    } else {
      this.emitUpdate({ account: accounts[0] })
    }
  }

  private handleClose(code: number, reason: string): void {
    if (__DEV__) {
      console.log("Handling 'close' event with payload", code, reason)
    }
    this.emitDeactivate()
  }

  private handleNetworkChanged(networkId: string | number): void {
    if (__DEV__) {
      console.log("Handling 'networkChanged' event with payload", networkId)
    }
    this.emitUpdate({ chainId: networkId, provider: window.platon })
  }

  public async activate(): Promise<ConnectorUpdate> {
    if (!window.platon) {
      throw new NoplatonProviderError()
    }

    if (window.platon.on) {
      window.platon.on('chainChanged', this.handleChainChanged)
      window.platon.on('accountsChanged', this.handleAccountsChanged)
      window.platon.on('close', this.handleClose)
      window.platon.on('networkChanged', this.handleNetworkChanged)
    }

    if ((window.platon as any).isMetaMask) {
      ;(window.platon as any).autoRefreshOnNetworkChange = false
    }

    // try to activate + get account via eth_requestAccounts
    let account
    try {
      account = await (window.platon.send as Send)('platon_requestAccounts').then(
        sendReturn => parseSendReturn(sendReturn)[0]
      )
    } catch (error) {
      if ((error as any).code === 4001) {
        throw new UserRejectedRequestError()
      }
      warning(false, 'platon_requestAccounts was unsuccessful, falling back to enable')
    }

    // if unsuccessful, try enable
    if (!account) {
      // if enable is successful but doesn't return accounts, fall back to getAccount (not happy i have to do this...)
      account = await window.platon.enable().then(sendReturn => sendReturn && parseSendReturn(sendReturn)[0])
    }

    return { provider: window.platon, ...(account ? { account } : {}) }
  }

  public async getProvider(): Promise<any> {
    return window.platon
  }

  public async getChainId(): Promise<number | string> {
    if (!window.platon) {
      throw new NoplatonProviderError()
    }

    let chainId
    try {
      // chainId = await (window.platon.send as Send)('platon_chainId').then(parseSendReturn)
      chainId = "0x33585"
    } catch {
      warning(false, 'platon_chainId was unsuccessful, falling back to net_version')
    }

    if (!chainId) {
      try {
        chainId = await (window.platon.send as Send)('net_version').then(parseSendReturn)
      } catch {
        warning(false, 'net_version was unsuccessful, falling back to net version v2')
      }
    }

    if (!chainId) {
      try {
        chainId = parseSendReturn((window.platon.send as SendOld)({ method: 'net_version' }))
      } catch {
        warning(false, 'net_version v2 was unsuccessful, falling back to manual matches and static properties')
      }
    }

    if (!chainId) {
      if ((window.platon as any).isDapper) {
        chainId = parseSendReturn((window.platon as any).cachedResults.net_version)
      } else {
        chainId =
          (window.platon as any).chainId ||
          (window.platon as any).netVersion ||
          (window.platon as any).networkVersion ||
          (window.platon as any)._chainId
      }
    }

    return chainId
  }

  public async getAccount(): Promise<null | string> {
    if (!window.platon) {
      throw new NoplatonProviderError()
    }

    let account
    try {
      account = await (window.platon.send as Send)('platon_accounts').then(sendReturn => parseSendReturn(sendReturn)[0])
    } catch {
      warning(false, 'platon_accounts was unsuccessful, falling back to enable')
    }

    if (!account) {
      try {
        account = await window.platon.enable().then(sendReturn => parseSendReturn(sendReturn)[0])
      } catch {
        warning(false, 'enable was unsuccessful, falling back to platon_accounts v2')
      }
    }

    if (!account) {
      account = parseSendReturn((window.platon.send as SendOld)({ method: 'platon_accounts' }))[0]
    }

    return account
  }

  public deactivate() {
    if (window.platon && window.platon.removeListener) {
      window.platon.removeListener('chainChanged', this.handleChainChanged)
      window.platon.removeListener('accountsChanged', this.handleAccountsChanged)
      window.platon.removeListener('close', this.handleClose)
      window.platon.removeListener('networkChanged', this.handleNetworkChanged)
    }
  }

  public async isAuthorized(): Promise<boolean> {
    if (!window.platon) {
      return false
    }

    try {
      return await (window.platon.send as Send)('platon_accounts').then(sendReturn => {
        if (parseSendReturn(sendReturn).length > 0) {
          return true
        } else {
          return false
        }
      })
    } catch {
      return false
    }
  }
}
