import { ethers } from "ethers";
import Router from "next/router";
import { useState, useEffect } from "react";
import PrimaryButton from "../components/primary-button";
import Keyboard from "../components/keyboard";
import TipButton from "../components/tip-button"
import getKeyboardsContract from "../utils/getKeyboardsContract"
import addressesEqual from "../utils/addressesEqual";
import { UserCircleIcon } from "@heroicons/react/solid"
import abi from "../utils/Keyboards.json"
import { toast } from "react-hot-toast"
import { useMetaMaskAccount } from "../components/meta-mask-account-provider";

export default function Create() {
  const { ethereum, connectedAccount, connectAccount } = useMetaMaskAccount();
  const [mining, setMining] = useState(false)
  const [keyboardsLoading, setKeyboardsLoading] = useState(false);
  const [keyboards, setKeyboards] = useState([])
  const keyboardsContract = getKeyboardsContract(ethereum);


  const [keyboardKind, setKeyboardKind] = useState(0)
  const [isPBT, setIsPBT] = useState(false)
  const [filter, setFilter] = useState('')

  const contractAddress = '0x8A45024a580ec0d4F8f0c28B93C6c873725Ab910';
  const contractABI = abi.abi;

  const getKeyboards = async () => {
    if (keyboardsContract && connectedAccount) {
      setKeyboardsLoading(true);
      try {
        const keyboards = await keyboardsContract.getKeyboards();
        console.log('Retrieved keyboards...', keyboards)
  
        setKeyboards(keyboards)
      } finally {
        setKeyboardsLoading(false);
      }
    }
  }
  useEffect(() => getKeyboards(), [!!keyboardsContract, connectedAccount])

  const addContractEventHandlers = () => {
    if (keyboardsContract && connectedAccount) {
      keyboardsContract.on('KeyboardCreated', async (keyboard) => {
        if (connectedAccount && !addressesEqual(keyboard.owner, connectedAccount)) {
          toast('Somebody created a new keyboard!', { id: JSON.stringify(keyboard) });
        }
        await getKeyboards();
      })
  
      keyboardsContract.on('TipSent', (recipient, amount) => {
        if (addressesEqual(recipient, connectedAccount)) {
          toast(`You received a tip of ${ethers.utils.formatEther(amount)} eth!`, { id: recipient + amount });
        }
      })
    }
  }
  
  useEffect(addContractEventHandlers, [!!keyboardsContract, connectedAccount]);


  const submitCreate = async (e) => {
    e.preventDefault();
  
    if (!ethereum) {
      console.error('Ethereum object is required to create a keyboard');
      return;
    }
  
    setMining(true);
    try {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const keyboardsContract = new ethers.Contract(contractAddress, contractABI, signer);
  
      const createTxn = await keyboardsContract.create(keyboardKind, isPBT, filter)
      console.log('Create transaction started...', createTxn.hash)
  
      await createTxn.wait();
      console.log('Created keyboard!', createTxn.hash);
  
      await getKeyboards()

      Router.push('/');
    } finally {
      setMining(false);
    }
  }
  

  if (!ethereum) {
    return <p>Please install MetaMask to connect to this site</p>
  }

  if (!connectedAccount) {
    return <PrimaryButton onClick={connectAccount}>Connect MetaMask Wallet</PrimaryButton>
  }

  if (keyboardsLoading) {
    return (
      <div className="flex flex-col gap-4">
        <PrimaryButton type="link" href="/create">Create a Keyboard!</PrimaryButton>
        <p>Loading Keyboards...</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-y-8">
      <form className="mt-8 flex flex-col gap-y-6">
        <div>
          <label htmlFor="keyboard-type" className="block text-sm font-medium text-gray-700">
            Keyboard Type
          </label>
          <select
            id="keyboard-type"
            name="keyboard-type"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={keyboardKind}
            onChange={(e) => { setKeyboardKind(e.target.value) }}
          >
            <option value="0">60%</option>
            <option value="1">75%</option>
            <option value="2">80%</option>
            <option value="3">ISO-105</option>
          </select>
        </div>

        <div>
          <label htmlFor="keycap-type" className="block text-sm font-medium text-gray-700">
            Keycap Type
          </label>
          <select
            id="keycap-type"
            name="keycap-type"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={isPBT ? "pbt" : "abs"}
            onChange={(e) => { setIsPBT(e.target.value === "pbt") }}
          >
            <option value="abs">ABS</option>
            <option value="pbt">PBT</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter" className="block text-sm font-medium text-gray-700">
            Filter
          </label>
          <select
            id="filter"
            name="filter"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            onChange={(e) => { setFilter(e.target.value) }}
            value={filter}
          >
            <option value="">None</option>
            <option value="sepia">Sepia</option>
            <option value="grayscale">Grayscale</option>
            <option value="invert">Invert</option>
            <option value="hue-rotate-90">Hue Rotate (90°)</option>
            <option value="hue-rotate-180">Hue Rotate (180°)</option>
          </select>
        </div>

        <PrimaryButton type="submit" onClick={submitCreate}>
          Create Keyboard!
        </PrimaryButton>
      </form>
      <Keyboard kind={keyboardKind} isPBT={isPBT} filter={filter}/>
      <PrimaryButton type="submit" disabled={mining} onClick={submitCreate}>
        {mining ? "Creating..." : "Create Keyboard"}
      </PrimaryButton>
      {
        keyboards.length > 0 ? <div className="flex flex-col gap-4">
        <PrimaryButton type="link" href="/create">Create a Keyboard!</PrimaryButton>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
        {keyboards.map(
            ([kind, isPBT, filter, owner], i) => (
              <div key={i} className="relative">
                <Keyboard kind={kind} isPBT={isPBT} filter={filter} />
                <span className="absolute top-1 right-6">
                  {addressesEqual(owner, connectedAccount) ?
                    <UserCircleIcon className="h-5 w-5 text-indigo-100" /> :
                    <TipButton ethereum={ethereum} index={i} />
                  }
                </span>
              </div>
            )
          )}
        </div>
      </div> : null
      }
    </div>
  )
}
