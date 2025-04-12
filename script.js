const contractAddress = "0x05f39d7BE8eE9d385f76a06e9817562bad456E88";
const abi = [
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "getBalance",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

let provider, signer, contract;
let userAddress;
let basePOL = 0;
let depositTime = Date.now();

const POL_TO_USD = 0.18;
const HOURLY_RATE = 0.05;

async function connecterMetaMask() {
  if (!window.ethereum) return alert("❌ MetaMask non détecté");

  await ethereum.request({ method: "eth_requestAccounts" });
  provider = new ethers.providers.Web3Provider(window.ethereum);
  signer = provider.getSigner();
  userAddress = await signer.getAddress();
  contract = new ethers.Contract(contractAddress, abi, signer);

  if (!localStorage.getItem("depositTime")) {
    localStorage.setItem("depositTime", Date.now());
  }

  depositTime = Number(localStorage.getItem("depositTime"));

  updateMaticBalance();
  await actualiserInfos();
  startGainAnimation();
}

async function updateMaticBalance() {
  const balance = await provider.getBalance(userAddress);
  const formatted = ethers.utils.formatEther(balance);
  document.getElementById("maticBalance").innerText = `${parseFloat(formatted).toFixed(4)} MATIC`;
}

async function actualiserInfos() {
  const balanceStaked = await contract.getBalance(userAddress);
  basePOL = parseFloat(ethers.utils.formatEther(balanceStaked));

  const capitalUSD = (basePOL * POL_TO_USD).toFixed(2);
  document.getElementById("solde").innerText = `${basePOL.toFixed(4)} POL`;
  document.getElementById("capitalUSD").innerText = `~${capitalUSD} USD`;
}

// Calcul du gain basé sur l’heure courante
function calculGainLive() {
  const now = Date.now();
  const hoursPassed = (now - depositTime) / (1000 * 60 * 60);
  return basePOL * (Math.pow(1 + HOURLY_RATE, hoursPassed) - 1);
}

function startGainAnimation() {
  setInterval(() => {
    const gain = calculGainLive();
    const total = basePOL + gain;
    const usdGain = gain * POL_TO_USD;
    const usdTotal = total * POL_TO_USD;

    document.getElementById("gain").innerText = `${gain.toFixed(4)} POL (~${usdGain.toFixed(2)} USD)`;
    document.getElementById("capitalTotalPOL").innerText = `${total.toFixed(4)} POL`;
    document.getElementById("capitalTotalUSD").innerText = `~${usdTotal.toFixed(2)} USD`;
  }, 1000); // animation chaque seconde
}

// Dépôt
document.getElementById("depotBtn").onclick = async () => {
  const montant = document.getElementById("montant").value;
  if (montant <= 0) return alert("⚠️ Montant invalide");

  const tx = await contract.deposit({ value: ethers.utils.parseEther(montant) });
  await tx.wait();
  localStorage.setItem("depositTime", Date.now());
  depositTime = Date.now();
  await actualiserInfos();
};

// Retrait
document.getElementById("retraitBtn").onclick = async () => {
  const montant = document.getElementById("montant").value;
  if (montant <= 0) return alert("⚠️ Montant invalide");

  const tx = await contract.withdraw(ethers.utils.parseEther(montant));
  await tx.wait();
  await actualiserInfos();
};

document.getElementById("connecter").onclick = connecterMetaMask;
document.getElementById("refresh").onclick = async () => {
  await actualiserInfos();
  updateMaticBalance();
};

