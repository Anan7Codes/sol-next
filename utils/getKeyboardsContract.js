import { ethers } from "ethers";

import abi from "../utils/Keyboards.json"

const contractAddress = '0x8A45024a580ec0d4F8f0c28B93C6c873725Ab910';
const contractABI = abi.abi;

export default function getKeyboardsContract(ethereum) {
  if(ethereum) {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(contractAddress, contractABI, signer);
  } else {
    return undefined;
  }
}
