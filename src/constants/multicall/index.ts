import { ChainId } from 'platondevswap-sdk'
import MULTICALL_ABI from './abi.json'

const MULTICALL_NETWORKS: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441',
  [ChainId.ROPSTEN]: '0x53C43764255c17BD724F74c4eF150724AC50a3ed',
  [ChainId.KOVAN]: '0x2cc8688C5f75E365aaEEb4ea8D6a480405A48D2A',
  [ChainId.RINKEBY]: '0x42Ad527de7d4e9d9d011aC45B31D8551f8Fe9821',
  [ChainId.GÖRLI]: '0x77dCa2C955b15e9dE4dbBCf1246B4B85b651e50e',
  [ChainId.PLATON]: '0xe390942ad042578C444Df8103643d15bE7CEa2F5',     // 修改4 新增链对应的multical合约
  [ChainId.PLATONDEV]: '0xe390942ad042578C444Df8103643d15bE7CEa2F5',  // 修改4 新增链对应的multical合约
  [ChainId.ALAYA]: '0xe390942ad042578C444Df8103643d15bE7CEa2F5',      // 修改4 新增链对应的multical合约
  [ChainId.ALAYADEV]: '0xe390942ad042578C444Df8103643d15bE7CEa2F5',   // 修改4 新增链对应的multical合约
}

export { MULTICALL_ABI, MULTICALL_NETWORKS }
